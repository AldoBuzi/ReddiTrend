from pydantic import BaseModel
from typing import List, Dict, Any


class Posts(BaseModel):
    timestamp: int
    body: str
    title: str
    karma: int
    subreddit: str
    link: str
    sentiment: float

class NodeAttributes(BaseModel):
    label: str
    size: int |Any 
    sentiment: float
    color: str
    posts: List[Posts] 

class Node(BaseModel):
    key: str
    attributes: NodeAttributes

class EdgeAttributes(BaseModel):
    label: str
    size: int |Any 
    color: str

class Edge(BaseModel):
    source: str
    target: str
    attributes: EdgeAttributes

class GraphResponse(BaseModel):
    nodes: List[Node]
    edges: List[Edge]