from fastapi import FastAPI, HTTPException
from connection import get_session
from models import Vertex, Edge

app = FastAPI()
session = get_session()

@app.get("/vertices/{keyword}", response_model=Vertex)
def get_vertex(keyword: str):
    query = "SELECT keyword, count, sentiment FROM graph.vertices WHERE keyword=%s"
    result = session.execute(query, [keyword]).one()

    if result:
        return Vertex(**result._asdict())
    
    raise HTTPException(status_code=404, detail="Vertex not found")

@app.get("/vertices", response_model=list[Vertex])
def get_all_vertices():
    query = "SELECT keyword, count, sentiment FROM graph.vertices"
    results = session.execute(query)
    return [Vertex(**row._asdict()) for row in results]

@app.get("/edges/{keyword_x}/{keyword_y}", response_model=Edge)
def get_edge(keyword_x: str, keyword_y: str):
    query = "SELECT keyword_x, keyword_y, count FROM graph.edges WHERE keyword_x=%s AND keyword_y=%s"
    result = session.execute(query, [keyword_x, keyword_y]).one()

    if result:
        return Edge(**result._asdict())
    
    raise HTTPException(status_code=404, detail="Edge not found")

@app.get("/edges", response_model=list[Edge])
def get_all_edges():
    query = "SELECT keyword_x, keyword_y, count FROM graph.vertices"
    results = session.execute(query)
    return [Edge(**row._asdict()) for row in results]

@app.get("/top_nodes")
def get_top_nodes(limit: int = 100):
    # Query nodes ordered by count descending, limit by `limit`
    rows = session.execute("""
        SELECT keyword, count FROM keywords
        WHERE count IS NOT NULL
        ORDER BY count DESC
        LIMIT %s
    """, (limit,))
    
    nodes = [{"id": r.keyword, "label": r.keyword, "count": r.count} for r in rows]
    
    # Optionally, fetch edges between these top nodes:
    node_ids = [r.keyword for r in rows]
    edges = []
    # This requires a query like:
    # SELECT * FROM edges WHERE keyword_x IN ? AND keyword_y IN ?
    # Cassandra doesn't support complex IN queries easily; you may need to fetch edges by multiple queries or precompute
    
    return {"nodes": nodes, "edges": edges}