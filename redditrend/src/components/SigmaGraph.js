
import { useEffect, useRef, useState, useCallback } from 'react'
import Sigma from 'sigma'
import Graph from 'graphology'
import data from './data.json'
import ForceSupervisor from "graphology-layout-force/worker"
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import forceAtlas2 from 'graphology-layout-forceatlas2';
import random from 'graphology-layout/random';
import noverlap from 'graphology-layout-noverlap';

const SigmaGraph = () => {
    const containerRef = useRef(null);
    const rendererRef = useRef(null);
    const graphRef = useRef(null);
    
    const [hoveredNode, setHoveredNode] = useState(null);
    const [hoveredNeighbors, setHoveredNeighbors] = useState(null);
    const [selectedNode, setSelectedNode] = useState(null);
    const [suggestions, setSuggestions] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

    const handleSetHoveredNode = useCallback((node) => {
        if (node && graphRef.current) {
            setHoveredNode(node);
            setHoveredNeighbors(new Set(graphRef.current.neighbors(node)));
        } else {
            setHoveredNode(null);
            setHoveredNeighbors(null);
        }

        // Refresh rendering
        if (rendererRef.current) {
            rendererRef.current.refresh({
                skipIndexation: true,
            });
        }
    }, []);

    const nodeReducer = useCallback((node, data) => {
        const res = { ...data };

        if (hoveredNeighbors && !hoveredNeighbors.has(node) && hoveredNode !== node) {
            res.label = "";
            res.color = "#f6f6f6";
        }

        if (selectedNode === node) {
            res.highlighted = true;
        } else if (suggestions) {
            if (suggestions.has(node)) {
                res.forceLabel = true;
            } else {
                res.label = "";
                res.color = "#f6f6f6";
            }
        }

        return res;
    }, [hoveredNode, hoveredNeighbors, selectedNode, suggestions]);

    const edgeReducer = useCallback((edge, data) => {
        const res = { ...data };
        const graph = graphRef.current;
        
        if (!graph) return res;

        if (
            hoveredNode &&
            !graph.extremities(edge).every((n) => n === hoveredNode || graph.areNeighbors(n, hoveredNode))
        ) {
            res.hidden = true;
        }

        if (
            suggestions &&
            (!suggestions.has(graph.source(edge)) || !suggestions.has(graph.target(edge)))
        ) {
            res.hidden = true;
        }

        return res;
    }, [hoveredNode, suggestions]);

    useEffect(() => {
        // Instantiate the graph
        const graph = new Graph();
        graph.import(data);
        graphRef.current = graph;

        // Create the spring layout and start it
        const layout = new ForceSupervisor(graph, { isNodeFixed: (_, attr) => attr.highlighted });
        layout.start();

        random.assign(graph);

        forceAtlas2.assign(graph, { 
        iterations: 600,
        settings: {
            barnesHutOptimize: true,
            gravity: 0.05,
            scalingRatio: 5
        }
        });

        noverlap.assign(graph, { maxIterations: 150 });
                
        // Instantiate the sigma
        const renderer = new Sigma(graph, containerRef.current);
        rendererRef.current = renderer;

        // Bind graph interactions
        const handleEnterNode = ({ node }) => {
            handleSetHoveredNode(node);
        };
        
        const handleLeaveNode = () => {
            handleSetHoveredNode(null);
        };

        renderer.on("enterNode", handleEnterNode);
        renderer.on("leaveNode", handleLeaveNode);

        // State for drag'n'drop
        let draggedNode = null;
        let isDragging = false;

        // On mouse down on a node
        const handleDownNode = (e) => {
            isDragging = true;
            draggedNode = e.node;
            graph.setNodeAttribute(draggedNode, "highlighted", true);

            if (!renderer.getCustomBBox()) {
                renderer.setCustomBBox(renderer.getBBox());
            }
        };

        // On mouse move, if the drag mode is enabled, we change the position of the draggedNode
        const handleMoveBody = ({ event }) => {
            if (!isDragging || !draggedNode) return;

            // Get new position of node
            const pos = renderer.viewportToGraph(event);

            graph.setNodeAttribute(draggedNode, "x", pos.x);
            graph.setNodeAttribute(draggedNode, "y", pos.y);

            // Prevent sigma to move camera:
            event.preventSigmaDefault();
            event.original.preventDefault();
            event.original.stopPropagation();
        };

        // On mouse up, we reset the dragging mode
        const handleUp = () => {
            if (draggedNode) {
                graph.removeNodeAttribute(draggedNode, "highlighted");
            }

            isDragging = false;
            draggedNode = null;
        };

        // Add click handler for node selection
        const handleClickNode = ({ node }) => {
            setSelectedNode(selectedNode === node ? null : node);
        };

        renderer.on("downNode", handleDownNode);
        renderer.on("moveBody", handleMoveBody);
        renderer.on("upNode", handleUp);
        renderer.on("upStage", handleUp);
        renderer.on("clickNode", handleClickNode);

        return () => {
            // Clean up event listeners
            renderer.off("enterNode", handleEnterNode);
            renderer.off("leaveNode", handleLeaveNode);
            renderer.off("downNode", handleDownNode);
            renderer.off("moveBody", handleMoveBody);
            renderer.off("upNode", handleUp);
            renderer.off("upStage", handleUp);
            renderer.off("clickNode", handleClickNode);
            
            renderer.kill();
            rendererRef.current = null;
            graphRef.current = null;
        };
    }, []); // Keep empty dependency array since we want this to run only once

    // Update reducers when state changes
    useEffect(() => {
        if (rendererRef.current) {
            rendererRef.current.setSetting("nodeReducer", nodeReducer);
            rendererRef.current.setSetting("edgeReducer", edgeReducer);
            rendererRef.current.refresh({ skipIndexation: true });
        }
    }, [nodeReducer, edgeReducer]);

    return (
        <div className="d-flex justify-content-center mt-4">
            <Col className="h-100">
                <Row className="d-flex justify-content-center">
                    <div className="d-flex justify-content-center">
                        <input
                            type="text"
                            placeholder="Search nodes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {selectedNode && (
                            <button
                                onClick={() => setSelectedNode(null)}
                                className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                            >
                                Clear Selection
                            </button>
                        )}
                    </div>
                </Row>
                <Row className="d-flex justify-content-center">
                    <div className="d-flex justify-content-center text-sm text-gray-600">
                        {hoveredNode && <span>Hovered: {hoveredNode} | </span>}
                        {selectedNode && <span>Selected: {selectedNode} | </span>}
                        <span>Search: "{searchQuery}"</span>
                    </div>         
                    <div
                        ref={containerRef}
                        style={{ 
                            width: '800px', 
                            height: '600px',
                            background: 'white',
                            border: '1px solid #ccc',
                            borderRadius: '8px'
                        }}
                    />
                </Row>
            </Col>
        </div>
    )
}

export default SigmaGraph