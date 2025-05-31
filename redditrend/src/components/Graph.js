import { useEffect } from 'react'
import Sigma from 'sigma'
import graphology from 'graphology'

const Graph = () => {
    useEffect(() => {
        // Create a graphology graph
        const graph = new graphology.Graph();
        graph.addNode("1", { label: "Node 1", x: 0, y: 0, size: 10, color: "blue" });
        graph.addNode("2", { label: "Node 2", x: 1, y: 1, size: 20, color: "red" });
        graph.addEdge("1", "2", { size: 5, color: "purple" });

        // Instantiate sigma.js and render the graph
        const sigmaInstance = new Sigma(graph, document.getElementById("container"));
    }, [])

    return <div id="container" style={{width: "800px", height: "600px", background: "white"}} />
}

export default Graph