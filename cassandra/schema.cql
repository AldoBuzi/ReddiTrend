-- Create the keyspace
CREATE KEYSPACE IF NOT EXISTS graph WITH REPLICATION = { 'class' : 'SimpleStrategy', 'replication_factor' : '1' };

-- Create the table vertices
CREATE TABLE IF NOT EXISTS graph.vertices (
    keyword text PRIMARY KEY,
    count counter
);

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
    count_x counter,
    count_y counter,
    count counter,
    PRIMARY KEY (keyword_x, keyword_y)
);