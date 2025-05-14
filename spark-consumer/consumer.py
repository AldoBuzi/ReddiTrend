from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("RedditKafkaConsumer") \
    .getOrCreate()

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

# Show to console (for debug)
query = parsed.writeStream \
    .outputMode("append") \
    .format("console") \
    .start()

query.awaitTermination()
