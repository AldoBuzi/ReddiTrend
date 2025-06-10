
from cassandra.cluster import Cluster
from cassandra.policies import DCAwareRoundRobinPolicy
from threading import Lock

class CassandraConnector:
    _lock = Lock()
    _session = None

    @classmethod
    def get_session(cls):
        with cls._lock:
            if cls._session is None:
                cluster = Cluster(['cassandra-service'], load_balancing_policy=DCAwareRoundRobinPolicy())
                cls._session = cluster.connect('graph')
            return cls._session