from pyspark.sql import SparkSession
from graphframes import GraphFrame

spark = None
def init_spark(app_name="SparkApp") -> "SparkSession":
    global spark
    if spark == None:
        spark = SparkSession.builder.appName(app_name)\
            .config("spark.cassandra.connection.host", "cassandra-service") \
            .config("spark.cassandra.connection.port", "9042") \
            .config("spark.sql.extensions", "com.datastax.spark.connector.CassandraSparkExtensions") \
            .getOrCreate()
    return spark

#.config("spark.cassandra.auth.username", "my_username") \
 # .config("spark.cassandra.auth.password", "my_password") \