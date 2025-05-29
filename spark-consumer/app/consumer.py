from pyspark.sql import SparkSession
from app.spark import init_spark
from pyspark.sql.functions import from_json, col
from pyspark.sql.types import StructType, StringType, IntegerType, ArrayType
from keybert import KeyBERT
import pandas as pd
pd.set_option("display.max_colwidth", None)


kw_model = KeyBERT()

def extract_keywords(batch_df, batch_id):
    # Convert Spark DataFrame to pandas
    pdf = batch_df.toPandas()
    # Apply KeyBERT
    pdf["keywords"] = pdf["title"].apply(lambda x: kw_model.extract_keywords(x,keyphrase_ngram_range=(1, 2), top_n=5))

    # Print the result
    print(f"=== BATCH {batch_id} ===")
    print(pdf[:])

spark = init_spark("ReddiTrendConsumer")


# Read from Kafka topic
# Kafka service name in K8s
# Default topic is reddit-posts
# Note that if you change the name of the boostrap server of the broker, you must change the entry also here
df = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "my-cluster-kafka-bootstrap.kafka.svc:9092") \
    .option("subscribe", "reddit-posts") \
    .option("startingOffsets", "latest") \
    .load()

schema = StructType() \
    .add("timestamp", IntegerType()) \
    .add("title", StringType()) \
    .add("karma", IntegerType()) \
    .add("subreddit", StringType()) \
    .add("text",StringType())\
    .add("comments", ArrayType(
        StructType()
        .add("text", StringType())
        .add("karma", IntegerType())
    )) \
    .add("link", StringType()) 

# Parse Kafka message value
parsed = df.selectExpr("CAST(value AS STRING) as json_data")

parsed_df = parsed.select(from_json(col("json_data"), schema=schema).alias("data"))


query = parsed_df.select("data.*") \
    .writeStream \
    .outputMode("append") \
    .format("console") \
    .foreachBatch(extract_keywords) \
    .option("truncate", False) \
    .start()\
    .awaitTermination()

