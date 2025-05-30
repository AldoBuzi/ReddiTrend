from pydantic import BaseModel

class Vertex(BaseModel):
    keyword: str
    count: int
    sentiment: float

class Edge(BaseModel):
    keyword_x: str
    keyword_y: str
    count: int