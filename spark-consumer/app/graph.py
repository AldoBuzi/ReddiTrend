from graphframes import GraphFrame
from pyspark.sql import SparkSession
from pyspark.sql import DataFrame
from pyspark.sql.functions import col, explode, udf
from pyspark.sql.types import ArrayType, StringType, StructType
#from app.schema import spark, schema
from itertools import combinations



def generate_pairs(keywords):
    return [(a, b) for a, b in combinations(sorted(set(keywords)), 2)]

def add_vertices(spark: "SparkSession", df: DataFrame, debug=False):
    # Explode keywords into rows, select distinct keywords as vertices
    df = df.withColumn("keyword",explode(col("keywords")))
    
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