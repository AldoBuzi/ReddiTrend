from pyspark.sql import SparkSession
from pyspark.sql import DataFrame
from pyspark.sql.functions import col, explode, udf
from pyspark.sql.types import ArrayType, StringType, StructType, FloatType
#from app.schema import spark, schema
from itertools import combinations
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer


def extract_sentiment(row):
    analyzer = SentimentIntensityAnalyzer()
    results = []
    for comment in row:
        text = comment["text"]
        score = analyzer.polarity_scores(text)["compound"]
        results.append(score)
    return sum(results) / len(results) if results else 0

sentiment_udf = udf(extract_sentiment, FloatType())

def generate_pairs(keywords):
    pairs = []
    for a, b in combinations(sorted(set(keywords)), 2):
        pairs.append((a, b))
        pairs.append((b, a))
    return pairs
def add_vertices(spark: "SparkSession", df: DataFrame, debug=False):
    # Explode keywords into rows, select distinct keywords as vertices
    #sentiment_score = df.select(col("comments")).rdd.flatMap(extract_sentiment)
    df = df.withColumn("sentiment",sentiment_udf(col("comments")) ).withColumn("keyword",explode(col("keywords")))
    
    pair_udf = udf(generate_pairs, ArrayType(StructType()
        .add("src", StringType())
        .add("dst", StringType()))
    )
    edges_df = df.withColumn("pairs", pair_udf(col("keywords"))) \
                .select(explode(col("pairs")).alias("pair")) \
                .select(col("pair.src"), col("pair.dst")) \
                .distinct()  # avoid repeated edges

    
    if debug:
        print("=== VERTICES ===")
        df.show(truncate=True)
        print("###################################")
        edges_df.show(truncate=False)
        print("###################################")
    return (df.drop("keywords"),edges_df)