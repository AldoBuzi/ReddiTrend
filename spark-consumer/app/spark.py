from pyspark.sql import SparkSession
from graphframes import GraphFrame

def init_spark(app_name="SparkApp") -> "SparkSession":
    return SparkSession.builder.appName(app_name).getOrCreate()

def process_message(spark, message):
    # Create a DataFrame with the message content
    df = spark.createDataFrame([(message,)], ["message"])
    df.show()