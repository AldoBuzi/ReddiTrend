from fastapi import FastAPI, HTTPException, Query
from connection import get_session
from models import GraphResponse, Edge
import json
import os
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

USE_MOCK = os.getenv("USE_MOCK", "false").lower() == "true"


session = get_session() if USE_MOCK == False else None

def red_to_green(value: float):
    t = ((value if value != None else 0) + 1) / 2
    red = int(255 * (1 - t))
    green = int(255 * t)
    return f"rgb({red}, {green}, 0)"


@app.get("/expand-node/{node}/{depth}", response_model=GraphResponse)
def expand_node(node: str, depth: int):
    if USE_MOCK:
        with open(f"depth/depth_{depth}.json") as f:
            return json.load(f)
    
    graph = expand(node, depth=depth, visited=set())
    # Filter out the source node from the result
    graph["nodes"] = [n for n in graph["nodes"] if n["key"] != node]
    #try:
     #   with open('expand-nodes.json', 'a') as f:
      #    json.dump(graph, f, indent=2)
    #except Exception as e:
     #   print(f"Error exporting Cassandra data: {e}")
    
    return graph
    
def expand(node, depth: int, visited = None ) -> GraphResponse:
    if visited is None:
        visited = set()
    if depth == 0 or node in visited:
        return {"nodes": [], "edges": []}
    query = session.prepare("SELECT keyword_y, count FROM graph.edges WHERE keyword_x= ?")
    
    result = list(session.execute(query, (node,)))
    if len(result) == 0:
        return  {"nodes": [], "edges": []}

    visited.add(node)
    
    all_connected_nodes = {row.keyword_y for row in result}
    nodes = []
    edges = []
    query_info = session.prepare("SELECT * FROM graph.vertices_info WHERE keyword= ? LIMIT 6")
    query_count = session.prepare("SELECT count FROM graph.vertices WHERE keyword= ?")
    
    for row in result:
        edges.append({"source":node,"target":row.keyword_y, "attributes": {"label": node+"-"+row.keyword_y, "size": row.count, "color":"#FFFFFF"}})
    
    for n in all_connected_nodes:
        result_info = list(session.execute(query_info, (n,)))
        count_info = session.execute(query_count, (n,)).one()
        if count_info:
            sentiment_average = sum([row.sentiment for row in result_info if row.sentiment is not None]) / 5
            posts = [{"timestamp": row.timestamp, "body": row.body, "title": row.title, "karma": row.karma, "sentiment" : row.sentiment, "link": row.link , "subreddit": row.subreddit} for row in result_info]
            nodes.append({"key":n,"attributes": {"label":n, "size":count_info.count ** 0.8, "sentiment" :  sentiment_average , "color" : red_to_green(sentiment_average), "posts":posts}})
    
    for n in all_connected_nodes:
        graph: GraphResponse = expand(n,depth=depth-1, visited=visited)
        nodes = nodes + [node for node in graph["nodes"] if node["key"] not in [node2["key"] for node2 in nodes ] ]
        edges = edges + [edge for edge in graph["edges"] if (edge["source"], edge["target"]) not in [(edge2["source"], edge2["target"]) for edge2 in edges] ]
        visited.add(n)
    return {"nodes": nodes, "edges": edges}
    
    

@app.get("/top-nodes", response_model=GraphResponse)
def get_top_nodes():
    # Return fake graph if mock is set to true
    if USE_MOCK:
        with open("top_nodes_and_edges.json") as f:
            return json.load(f)
    rows = session.execute("""SELECT * FROM top_nodes_edges""")
    nodes = []
    edges = []
    added_keywords = set()
    for row in rows:
        keyword_x_metadata = json.loads(row.keyword_x_metadata)
        keyword_y_metadata = json.loads(row.keyword_y_metadata)
        if row.keyword_x not in added_keywords:
            nodes.append({"key":row.keyword_x,"attributes": {"label":row.keyword_x, "size":row.count_x ** 0.8 , "sentiment" : row.sentiment_x , "color" : red_to_green(row.sentiment_x), "posts":keyword_x_metadata}})
        if row.keyword_y not in added_keywords:
            nodes.append({"key":row.keyword_y,"attributes": {"label":row.keyword_y, "size":row.count_y ** 0.8, "sentiment" : row.sentiment_y ,"color" : red_to_green(row.sentiment_y), "posts":keyword_y_metadata}})
        edges.append({"source":row.keyword_x,"target":row.keyword_y, "attributes": {"label": row.keyword_x+"-"+row.keyword_y, "size": row.count, "color":"#FFFFFF"}})
        added_keywords.add(row.keyword_x)
        added_keywords.add(row.keyword_y)
    #try:
     #   with open('top_nodes_and_edges.json', 'w') as f:
      #    json.dump({"nodes": nodes, "edges": edges}, f, indent=2)
    #except Exception as e:
     #   print(f"Error exporting Cassandra data: {e}")
    return {"nodes": nodes, "edges": edges}