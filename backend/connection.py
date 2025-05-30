from cassandra.cluster import Cluster
from cassandra.auth import PlainTextAuthProvider
import os

def get_session():
    host = os.getenv("CASSANDRA_HOST", "localhost")
    port = int(os.getenv("CASSANDRA_PORT", "9042"))
    cluster = Cluster([host], port=port)
    session = cluster.connect()
    session.set_keyspace("graph")
    return session