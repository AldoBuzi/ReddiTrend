from graphframes import GraphFrame
from pyspark.sql import SparkSession
from pyspark.sql import DataFrame
from pyspark.sql.functions import col, explode, udf
from pyspark.sql.types import ArrayType, StringType, StructType
#from app.schema import spark, schema
from itertools import combinations


#vertices =  spark.createDataFrame([],schema)
edges = []
#g = GraphFrame(vertices, edges)

# UDF to generate keyword pairs
def generate_pairs(keywords):
    return [(a, b) for a, b in combinations(sorted(set(keywords)), 2)]

def add_vertices(spark: "SparkSession", df: DataFrame, accuracy = 0.7, debug=False):
    #global vertices
    # Explode keywords into rows, select distinct keywords as vertices
    df = df.withColumn("keyword",explode(col("keywords"))).withColumnRenamed("keyword", "id")
    
    #vertices = vertices.union(spark_df)
    
    # Extract just keyword strings from tuples
    extract_kw = udf(lambda kws: [kw[0] for kw in kws], ArrayType(StringType()))
    clean_df = df.withColumn("keyword_list", extract_kw(col("id")))
    pair_udf = udf(generate_pairs, ArrayType(StructType()
        .add("src", StringType())
        .add("dst", StringType()))
    )
    edges_df = clean_df.withColumn("pairs", pair_udf(col("keyword_list"))) \
                .select(explode(col("pairs")).alias("pair")) \
                .select(col("pair.src"), col("pair.dst")) \
                .distinct()  # avoid repeated edges

    
    if debug:
        print("=== VERTICES ===")
        df.show(truncate=True)
        print("###################################")
        edges_df.show(truncate=False)
        print("###################################")
    return df