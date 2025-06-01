from pyspark.sql import SparkSession, DataFrame
from pyspark.sql.functions import collect_list, struct, to_json
spark: SparkSession = SparkSession.builder\
        .appName("SparkTopNodes")\
        .config("spark.cassandra.connection.host", "cassandra-service") \
        .config("spark.cassandra.connection.port", "9042") \
        .config("spark.sql.extensions", "com.datastax.spark.connector.CassandraSparkExtensions") \
        .getOrCreate()

# Load keywords with counts
keywords_df = spark.read.format("org.apache.spark.sql.cassandra") \
    .options(table="vertices", keyspace="graph") \
    .load()
    
keywords_info = spark.read.format("org.apache.spark.sql.cassandra") \
    .options(table="vertices_info", keyspace="graph") \
    .load()

aggregated_df = keywords_info.groupBy("keyword").agg(
    collect_list(struct("timestamp", "body","title","karma","subreddit","link","sentiment")).alias("metadata_list")
)
keywords_info_result = aggregated_df.withColumn("json_col", to_json("metadata_list"))


# Get top N nodes by count
top_nodes_df = keywords_df.orderBy(keywords_df["count"].desc()).limit(100)

# Collect top node list (small enough to collect)
top_nodes_list = [row["keyword"] for row in top_nodes_df.collect()]

# Broadcast top nodes list for filtering edges efficiently
top_nodes_broadcast = spark.sparkContext.broadcast(set(top_nodes_list))

# Load all edges
edges_df = spark.read.format("org.apache.spark.sql.cassandra") \
    .options(table="edges", keyspace="graph") \
    .load()
filtered_edges_df = edges_df.filter(
    (edges_df["keyword_x"].isin(top_nodes_list)) & (edges_df["keyword_y"].isin(top_nodes_list))
)
filtered_edges_df = filtered_edges_df.join(top_nodes_df.withColumnRenamed("keyword", "keyword_x").withColumnRenamed("count", "count_x"), on="keyword_x",how="left")
filtered_edges_df = filtered_edges_df.join(top_nodes_df.withColumnRenamed("keyword", "keyword_y").withColumnRenamed("count", "count_y"), on="keyword_y",how="left")
# add keywords metadata
filtered_edges_df = filtered_edges_df.join(keywords_info_result.select("keyword","json_col").withColumnRenamed("keyword", "keyword_x").withColumnRenamed("json_col","keyword_x_metadata"),on="keyword_x",how="left")
filtered_edges_df = filtered_edges_df.join(keywords_info_result.select("keyword","json_col").withColumnRenamed("keyword", "keyword_y").withColumnRenamed("json_col","keyword_y_metadata"),on="keyword_y",how="left")
# Filter edges where both ends are in top nodes

# Write filtered edges to precomputed table, overwriting existing data
filtered_edges_df.write.format("org.apache.spark.sql.cassandra") \
    .options(table="top_nodes_edges", keyspace="graph") \
    .mode("overwrite") \
    .option("confirm.truncate", "true") \
    .save()
