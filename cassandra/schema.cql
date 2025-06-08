-- Create the keyspace
CREATE KEYSPACE IF NOT EXISTS graph WITH REPLICATION = { 'class' : 'SimpleStrategy', 'replication_factor' : '1' };

-- Create the table vertices
CREATE TABLE IF NOT EXISTS graph.vertices (
    keyword text PRIMARY KEY,
    count counter
);

-- Create the table vertices_info
CREATE TABLE IF NOT EXISTS graph.vertices_info (
    timestamp int,
    keyword text,
    body text,
    title text,
    karma int,
    subreddit text,
    link text,
    sentiment float,
    PRIMARY KEY (keyword, karma, timestamp)
) WITH CLUSTERING ORDER BY (karma DESC, timestamp ASC);


-- Create the table edges
CREATE TABLE IF NOT EXISTS graph.edges (
    keyword_x text,
    keyword_y text,
    count counter,
    PRIMARY KEY (keyword_x, keyword_y)
);

-- Create the table of top nodes (precomputed)
CREATE TABLE IF NOT EXISTS graph.top_nodes_edges (
    keyword_x text,
    keyword_y text,
    count_x int,
    count_y int,
    count int,
    sentiment_x float,
    sentiment_y float,
    keyword_x_metadata text,
    keyword_y_metadata text,
    PRIMARY KEY (keyword_x, keyword_y)
);