from pyspark.sql import SparkSession
from graphframes import GraphFrame

spark = None
def init_spark(app_name="SparkApp") -> "SparkSession":
    global spark
    if spark == None:
        spark = SparkSession.builder.appName(app_name)\
            .master("local[*]") \
            .config("spark.driver.extraJavaOptions", "-Djava.library.path=/usr/local") \
            .config("spark.executor.extraJavaOptions", "-Djava.library.path=/usr/local") \
            .config("spark.driver.memory", "2G") \
            .config("spark.serializer", "org.apache.spark.serializer.KryoSerializer") \
            .config("spark.kryoserializer.buffer.max", "2000M") \
            .config("spark.driver.maxResultSize", "0") \
            .config("spark.jars.packages", "com.johnsnowlabs.nlp:spark-nlp_2.12:|release|") \
        .getOrCreate()
    return spark

def process_message(spark, message):
    # Create a DataFrame with the message content
    df = spark.createDataFrame([(message,)], ["message"])
    df.show()