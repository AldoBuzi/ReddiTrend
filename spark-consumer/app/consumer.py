from pyspark.sql import DataFrame
from app.schema import spark, schema
from app.graph import add_vertices
from pyspark.sql.functions import from_json, col, udf
from keybert import KeyBERT
from pyspark.sql.types import  StringType, ArrayType

def extract_keywords_udf(text, accuracy = 0.7):
    kw_model = KeyBERT()
    if text:
        keywords = kw_model.extract_keywords(text, keyphrase_ngram_range=(1, 2), top_n=5)
        # Just return keywords, or filter by relevance if needed
        return [kw[0] for kw in keywords if kw[1] > accuracy]
    return []
# Register UDF
extract_keywords = udf(extract_keywords_udf, ArrayType(StringType()))

def process_batch(batch_df: DataFrame, batch_id):
    keywords_df = batch_df.withColumn("keywords", extract_keywords(batch_df["title"]))
    keywords_df.show(truncate=False)  # Safe way to debug batch
    
    # Convert back to Spark DataFrame including keywords as array<string>
    #vertices = add_vertices(spark=spark,df=keywords_df, debug=True)
    # Print the result
    print(f"============== BATCH {batch_id} ==============")
    keywords_df.show(truncate=False) #safe there because this method is used inside "foreachBatch"



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


# Parse Kafka message value
parsed = df.selectExpr("CAST(value AS STRING) as json_data")

parsed_df = parsed.select(from_json(col("json_data"), schema=schema).alias("data"))


query = parsed_df.select("data.*") \
    .writeStream \
    .outputMode("append") \
    .format("console") \
    .foreachBatch(process_batch) \
    .option("truncate", True) \
    .start()
query.awaitTermination()

