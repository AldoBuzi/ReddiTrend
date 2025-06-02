
import { useEffect, useRef, useState, useCallback, useContext } from 'react'
import Sigma from 'sigma'
import Graph from 'graphology'
import data from './data.json'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import forceAtlas2 from 'graphology-layout-forceatlas2';
import { DarkModeContext } from '../App'

const SigmaGraph = () => {
    const containerRef = useRef(null);
    const rendererRef = useRef(null);
    const graphRef = useRef(null);
    
    const [hoveredNode, setHoveredNode] = useState(null);
    const [hoveredNeighbors, setHoveredNeighbors] = useState(null);
    const [selectedNode, setSelectedNode] = useState(null);
    const [suggestions, setSuggestions] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

    const darkMode = useContext(DarkModeContext)

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

    function setGraphLayout() {
        const center = {x: 0, y: 0};
        const maxDistance = 100; // max distance from center for smallest nodes

        graphRef.current.forEachNode((node, attrs) => {
        const size = attrs.size || 1;
        const sizeNorm = size / 100; // from 0 to 1

        // Distance is inverse of normalized size: bigger size → smaller distance
        const distance = maxDistance * (1 - sizeNorm);

        // Random angle around center
        const angle = Math.random() * 2 * Math.PI;

        // Compute x, y
        const x = center.x + distance * Math.cos(angle);
        const y = center.y + distance * Math.sin(angle);

        graphRef.current.setNodeAttribute(node, 'x', x);
        graphRef.current.setNodeAttribute(node, 'y', y);
        });

        forceAtlas2.assign(graphRef.current, {
            iterations: 100,
            settings: {
                gravity: 1,
                scalingRatio: 1,
                adjustSizes: true, // Keeps bigger nodes away from overlapping
                strongGravityMode: true // Helps centralize heavier nodes
            }
        });
    }

    useEffect(() => {
        // Instantiate the graph
        const graph = new Graph();
        graph.import(data);
        graphRef.current = graph;

        setGraphLayout()
                
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

        graph.forEachEdge((edge, attributes) => {
            graph.setEdgeAttribute(edge, 'size', attributes.size * 0.01);
        });

        renderer.on("enterNode", handleEnterNode);
        renderer.on("leaveNode", handleLeaveNode);

        // Add click handler for node selection
        const handleClickNode = ({ node }) => {
            setSelectedNode(selectedNode === node ? null : node);
        };

        renderer.on("clickNode", handleClickNode);

        return () => {
            // Clean up event listeners
            renderer.off("enterNode", handleEnterNode);
            renderer.off("leaveNode", handleLeaveNode);
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