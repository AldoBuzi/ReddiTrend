from pyspark.sql import DataFrame
from pyspark.rdd import (
    RDD,
)
from app.schema import spark, schema
from app.graph import add_vertices
from pyspark.sql.functions import from_json, col, udf
from pyspark.sql.types import  StringType, ArrayType
from cassandra.cluster import Cluster

kw_model = None

def extract_keywords_udf(text, accuracy = 0.75):
    global kw_model
    if kw_model is None:
        from keybert import KeyBERT
        kw_model = KeyBERT()  # Initialize once per executor
    if text:
        keywords = kw_model.extract_keywords(text, keyphrase_ngram_range=(1, 3), top_n=5)
        # Just return keywords, or filter by relevance if needed
        return [kw[0] for kw in keywords if kw[1] > accuracy]
    return []
# Register UDF
extract_keywords = udf(extract_keywords_udf, ArrayType(StringType()))

def process_batch(batch_df: DataFrame, batch_id):
    keywords_df = batch_df.withColumn("keywords", extract_keywords(batch_df["title"]))
    keywords_df.show(truncate=True)  # Safe way to debug batch
    
    (vertices,edges) = add_vertices(spark=spark,df=keywords_df, debug=True)
    
    if vertices.rdd.isEmpty(): #also lazy
        return
    def update_partition(rows):
        cluster = Cluster(['cassandra-service'])
        session = cluster.connect('graph')
        prepared = session.prepare("UPDATE vertices SET count = count + 1 WHERE keyword = ?")
        for row in rows:
            session.execute(prepared, (row.keyword,))
        session.shutdown()
        cluster.shutdown()
    vertices.foreachPartition(update_partition)
    def update_edges(rows):
        cluster = Cluster(['cassandra-service'])
        session = cluster.connect('graph')
        prepared = session.prepare(
            "UPDATE edges SET count = count +1 WHERE keyword_x = ? and keyword_y = ?"
        )
        for row in rows:
            session.execute(prepared, (row.src, row.dst))
        session.shutdown()
        cluster.shutdown()
    if edges.rdd.isEmpty(): #also lazy
        return
    edges.foreachPartition(update_edges)

    print(f"============== BATCH {batch_id} ==============")
    #keywords_df.show(truncate=False) #safe there because this method is used inside "foreachBatch"



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

