from pyspark.sql import SparkSession
from datetime import datetime, timedelta
from pyspark.sql.functions import col
from cassandra.cluster import Cluster
from cassandra.query import BatchStatement


# lower bound timestamp
cutoff_time = datetime.utcnow() - timedelta(hours=24)


spark: SparkSession = SparkSession.builder\
        .appName("Spark-Moving-Window")\
        .config("spark.cassandra.connection.host", "cassandra-service") \
        .config("spark.cassandra.connection.port", "9042") \
        .config("spark.sql.extensions", "com.datastax.spark.connector.CassandraSparkExtensions") \
        .getOrCreate()
        
        
# Load keywords with counts
keywords_df = spark.read.format("org.apache.spark.sql.cassandra") \
    .options(table="vertices_info", keyspace="graph") \
    .load()
    
old_posts = keywords_df.filter(col("timestamp") < cutoff_time.timestamp())


decrement_df = old_posts.groupBy("keyword").count().withColumnRenamed("count", "decrement")  # 'count' here means how much to decrement


vertices_df = spark.read \
    .format("org.apache.spark.sql.cassandra") \
    .options(table="vertices", keyspace="graph") \
    .load() \
    .select("keyword", "count")

updated_counts_df = vertices_df.join(decrement_df, "keyword", "inner") \
    .withColumn("new_count", col("decrement"))


    

def update_vertices_and_edges(rows):
    cluster = Cluster(['cassandra-service'])
    session = cluster.connect('graph')

    update_stmt = session.prepare("UPDATE vertices SET count = count - ? WHERE keyword = ?")

    for row in rows:
        keyword = str(row['keyword'])
        new_count = int(row['new_count'])
        old_count = int(row['count'])
        
        # This should not ever happen, but I put it just in case
        if old_count - new_count < 0 :
            session.execute(update_stmt, (0, keyword))
        elif new_count != 0:
            session.execute(update_stmt, (new_count, keyword))


    session.shutdown()
    cluster.shutdown()

updated_counts_df.foreachPartition(update_vertices_and_edges)

def delete_old_vertices_info(rows):
    cluster = Cluster(['cassandra-service'])
    session = cluster.connect('graph')

    delete_stmt = session.prepare("DELETE FROM vertices_info WHERE keyword = ? AND timestamp = ?")
    batch = BatchStatement()

    for row in rows:
        batch.add(delete_stmt, (row['keyword'], row['timestamp']))

        if len(batch) >= 50:
            session.execute(batch)
            batch.clear()

    if batch:
        session.execute(batch)

    session.shutdown()
    cluster.shutdown()
    
old_posts.foreachPartition(delete_old_vertices_info)
