from pyspark.sql import DataFrame
from app.schema import spark, schema
from app.graph import add_vertices
from pyspark.sql.functions import from_json, col
from app.utilities_consumer import extract_keywords
from cassandra.query import BatchStatement, BatchType
from app.cassandra_connector import CassandraConnector
import logging
# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def process_batch(batch_df: DataFrame, batch_id):
    
    print(f"============== BATCH {batch_id} ==============")
    
    keywords_df = batch_df.withColumn("keywords", extract_keywords(batch_df["title"]))
    keywords_df.show(truncate=True)  # Safe way to debug batch
    (vertices,edges) = add_vertices(spark=spark,df=keywords_df, debug=True)
    
    if vertices.rdd.isEmpty(): #also lazy
        return
    
    ## UPDATE VERTICES
    
    def update_partition(rows):
        session = CassandraConnector.get_session()
        
        prepared = session.prepare("UPDATE vertices SET count = count + 1 WHERE keyword = ?")
        insert_stmt = session.prepare("""INSERT INTO vertices_info (timestamp, keyword, body, title, karma, subreddit, link,sentiment) VALUES (?, ?, ?, ?, ?, ?, ?, ?) IF NOT EXISTS""")
        for row in rows:
            try:
                result = session.execute(insert_stmt, (
                    row.timestamp, row.keyword, row.text, row.title,
                    row.karma, row.subreddit, row.link, row.sentiment
                ))

                if result[0].applied:
                    session.execute(prepared, (row.keyword,))

            except Exception as e:
                logger.error(f"Cassandra write failed: {e}")
                continue
    vertices.repartition(10).foreachPartition(update_partition)
    
    ## UPDATE EDGES
    
    def update_edges(rows):
        session = CassandraConnector.get_session()
        update_stmt = session.prepare("""
            UPDATE edges SET count = count + 1 WHERE keyword_x = ? AND keyword_y = ?
        """)

        batch = BatchStatement(batch_type=BatchType.UNLOGGED)
        count = 0
        for row in rows:
            batch.add(update_stmt, (row.src, row.dst))
            count += 1
            if count >= 20:
                session.execute(batch)
                batch.clear()
                count = 0

        if count > 0:
            session.execute(batch)

    edges.repartition(10).foreachPartition(update_edges)



# Read from Kafka topic
# Kafka service name in K8s
# Default topic is reddit-posts
# Note that if you change the name of the boostrap server of the broker, you must change the entry also here
df = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "my-cluster-kafka-bootstrap.kafka.svc:9092") \
    .option("subscribe", "reddit-posts") \
    .option("startingOffsets", "latest") \
    .option("maxOffsetsPerTrigger", 1000) \
    .load()


# Parse Kafka message value
parsed = df.selectExpr("CAST(value AS STRING) as json_data")

parsed_df = parsed.select(from_json(col("json_data"), schema=schema).alias("data"))

query = parsed_df.select("data.*") \
    .writeStream \
    .outputMode("append") \
    .format("console") \
    .foreachBatch(process_batch) \
    .option("truncate", False) \
    .start()
query.awaitTermination()

