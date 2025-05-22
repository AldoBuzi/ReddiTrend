from pyspark.sql import SparkSession
from app.spark import init_spark, process_message
from pyspark.sql.functions import from_json, col
from pyspark.sql.types import StructType, StringType, TimestampType, IntegerType, ArrayType
import os 
print(os.getcwd())
spark = init_spark("RedditKafkaConsumer")

#spark = SparkSession.builder \
#    .appName("RedditKafkaConsumer") \
#    .getOrCreate()

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
    .add("comments", ArrayType(
        StructType()
        .add("text", StringType())
        .add("karma", IntegerType())
    )) \
    .add("link", StringType()) 

# Parse Kafka message value
parsed = df.selectExpr("CAST(value AS STRING) as json_data")

#Careful, from_json does not throw errors, we may need to check if data is NULL
parsed_df = parsed.select(from_json(col("json_data"), schema=schema).alias("data"))
#df = spark.read.json(spark.sparkContext.parallelize(['{ "timestamp": 1, "title": "CIAOOO", "karma": 154, "subreddit": "r/italy", "comments": [{"text":"ciao2","karma":1}],"link": "fakeUrl"}']))

successful_parse_df = parsed_df.filter("data IS NOT NULL")
# Continue with good records
successful_parse_df.select("data.*") \
    .writeStream \
    .outputMode("append") \
    .format("console") \
    .option("truncate", False) \
    .start() \
    .awaitTermination()

