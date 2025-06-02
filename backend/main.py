from fastapi import FastAPI, HTTPException
from connection import get_session
from models import Vertex, Edge
import json
import os
app = FastAPI()

USE_MOCK = os.getenv("USE_MOCK", "false").lower() == "true"


session = get_session() if USE_MOCK == False else None



#@app.get("/vertices/{keyword}", response_model=Vertex)
def get_vertex(keyword: str):
    query = "SELECT keyword, count, sentiment FROM graph.vertices WHERE keyword=%s"
    result = session.execute(query, [keyword]).one()

    if result:
        return Vertex(**result._asdict())
    
    raise HTTPException(status_code=404, detail="Vertex not found")

#@app.get("/vertices", response_model=list[Vertex])
def get_all_vertices():
    query = "SELECT keyword, count, sentiment FROM graph.vertices"
    results = session.execute(query)
    return [Vertex(**row._asdict()) for row in results]

#@app.get("/edges/{keyword_x}/{keyword_y}", response_model=Edge)
def get_edge(keyword_x: str, keyword_y: str):
    query = "SELECT keyword_x, keyword_y, count FROM graph.edges WHERE keyword_x=%s AND keyword_y=%s"
    result = session.execute(query, [keyword_x, keyword_y]).one()

    if result:
        return Edge(**result._asdict())
    
    raise HTTPException(status_code=404, detail="Edge not found")

#@app.get("/edges", response_model=list[Edge])
def get_all_edges():
    query = "SELECT keyword_x, keyword_y, count FROM graph.vertices"
    results = session.execute(query)
    return [Edge(**row._asdict()) for row in results]

@app.get("/top_nodes")
def get_top_nodes():
    # Return fake graph if mock is set to true
    if USE_MOCK:
        with open("top_nodes_and_edges.json") as f:
            return json.load(f)
        
    rows = session.execute("""SELECT * FROM top_nodes_edges""")
    nodes = []
    edges = []
    for row in rows:
        keyword_x_metadata = json.loads(row.keyword_x_metadata)
        keyword_y_metadata = json.loads(row.keyword_y_metadata)
        nodes.append([(row.keyword_x, {"label":row.keyword_x, "count":row.count_x, "metadata":keyword_x_metadata}),(row.keyword_y, {"label":row.keyword_y, "count":row.count_y, "metadata":keyword_y_metadata})])
        edges.append([(row.keyword_x,row.keyword_y, {"label": row.keyword_x+"-"+row.keyword_y, "count": row.count})])
        
    try:
        with open('top_nodes_and_edges.json', 'w') as f:
            json.dump({"nodes": nodes, "edges": edges}, f, indent=2)
    except Exception as e:
        print(f"Error exporting Cassandra data: {e}")
    return {"nodes": nodes, "edges": edges}