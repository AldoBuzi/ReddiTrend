
from pyspark.sql.types import StructType, StringType, IntegerType, ArrayType


from app.spark import init_spark


spark = init_spark("ReddiTrendConsumer")

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
    
def do_nothing():
    pass