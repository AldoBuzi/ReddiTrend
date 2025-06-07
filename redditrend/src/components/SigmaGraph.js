
import { useEffect, useRef, useState, useCallback, useContext, lazy } from 'react'
import Sigma from 'sigma'
import Graph from 'graphology'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import forceAtlas2 from 'graphology-layout-forceatlas2';
import { DarkModeContext } from '../App'

function SigmaGraph({ graphData }) {
    const darkMode = useContext(DarkModeContext)

    const containerRef = useRef(null);
    const inputRef = useRef(null);
    const suggestionsRef = useRef(null);
    const rendererRef = useRef(null);
    const graphRef = useRef(null);

    const state = useRef({
        hoveredNode: undefined,
        searchQuery: "",
        selectedNode: undefined,
        suggestions: undefined,
        hoveredNeighbors: undefined,
    });

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
        const container = containerRef.current;
        const searchInput = inputRef.current;
        const searchSuggestions = suggestionsRef.current;
    
        // Initialize the graph
        const graph = new Graph();
        graph.import(graphData);
        console.log(graphData)
        graphRef.current = graph;

        setGraphLayout()

        // TODO: Update the original edge size and color
        graph.forEachEdge((edge, attributes) => {
            graph.setEdgeAttribute(edge, 'size', attributes.size * 0.01);
            graph.setEdgeAttribute(edge, 'color', "#CCCCCC");
        });
    
        const renderer = new Sigma(graph, container)

        rendererRef.current = renderer;
    
        // Fill datalist with node labels
        searchSuggestions.innerHTML = graph
            .nodes()
            .map(
                (node) =>
                `<option value="${graph.getNodeAttribute(node, "label")}"></option>`
            )
            .join("\n");
    
        function setSearchQuery(query) {
            const currentState = state.current;
            currentState.searchQuery = query;
        
            if (searchInput.value !== query) searchInput.value = query;
        
            if (query) {
                const lcQuery = query.toLowerCase();
                const suggestions = graph
                    .nodes()
                    .map((n) => ({ id: n, label: graph.getNodeAttribute(n, "label") }))
                    .filter(({ label }) => label.toLowerCase().includes(lcQuery));
        
                if (suggestions.length === 1 && suggestions[0].label === query) {
                    currentState.selectedNode = suggestions[0].id;
                    currentState.suggestions = undefined;
            
                    const nodePosition = renderer.getNodeDisplayData(
                        currentState.selectedNode
                    );

                    if (nodePosition) {
                        renderer.getCamera().animate(nodePosition, { duration: 500 });

                        graph.forEachNode((node) => {
                            if (node === currentState.selectedNode) {
                                graph.setNodeAttribute(node, 'highlighted', true);
                            } else {
                                graph.setNodeAttribute(node, 'highlighted', false);
                            }
                        })
                    }
                } else {
                    currentState.selectedNode = undefined;
                    currentState.suggestions = new Set(suggestions.map(({ id }) => id));
                }
            } else {
                currentState.selectedNode = undefined;
                currentState.suggestions = undefined;
            }
        
            // This line gives error for some reason i don't know
            // renderer.refresh({ skipIndexation: true }); 
        }
    
        function setHoveredNode(node) {
            const currentState = state.current;

            if (node) {
                currentState.hoveredNode = node;
                currentState.hoveredNeighbors = new Set(graph.neighbors(node));
            } else {
                currentState.hoveredNode = undefined;
                currentState.hoveredNeighbors = undefined;
            }
        
            renderer.refresh({ skipIndexation: true });
        }
    
        searchInput.addEventListener("input", () => {
            setSearchQuery(searchInput.value || "");
        });

        searchInput.addEventListener("blur", () => {
            setSearchQuery("");
        });
    
        renderer.on("enterNode", ({ node }) => {
            setHoveredNode(node);
        });

        renderer.on("leaveNode", () => {
            setHoveredNode(undefined);
        });
    
        renderer.setSetting("nodeReducer", (node, data) => {
            const res = { ...data };
            const currentState = state.current;
        
            if (
                currentState.hoveredNeighbors &&
                !currentState.hoveredNeighbors.has(node) &&
                currentState.hoveredNode !== node
            ) {
                res.label = "";
                res.color = "#f6f6f6";
            }
        
            if (currentState.selectedNode === node) {
                res.highlighted = true;
            } else if (currentState.suggestions) {
                if (currentState.suggestions.has(node)) {
                    res.forceLabel = true;
                } else {
                    res.label = "";
                    res.color = "#f6f6f6";
                }
            } else {
                res.highlighted = false;
            }
        
            return res;
        });
    
        renderer.setSetting("edgeReducer", (edge, data) => {
            const res = { ...data };
            const currentState = state.current;
        
            if (
                currentState.hoveredNode &&
                !graph
                .extremities(edge)
                .every(
                    (n) =>
                    n === currentState.hoveredNode ||
                    graph.areNeighbors(n, currentState.hoveredNode)
                )
            ) {
                res.hidden = true;
            }
        
            if (
                currentState.suggestions &&
                (!currentState.suggestions.has(graph.source(edge)) ||
                !currentState.suggestions.has(graph.target(edge)))
            ) {
                res.hidden = true;
            }
        
            return res;
        });
    
        // Cleanup function
        return () => {
            renderer.kill();
        };
    }, [darkMode]);

    return (<>
            <div
                id="sigma-container"
                ref={containerRef}
                className="position-absolute top-50 start-50 translate-middle h-100 w-100 z-n1"
                style={{ }}
            />
            <input
                ref={inputRef}
                id="search-input"
                list="suggestions"
                placeholder="Search node"
                style={{ "backgroundColor": `${ darkMode ? "#292c35" : "" }`, border: "2px solid #CCCCCC", "outline": "none" }}
                className={`${ darkMode ? "text-white" : "" } position-absolute bottom-0 start-50 translate-middle-x w-50 p-3 rounded-4 mb-5`}
            />
            <datalist id="suggestions" ref={suggestionsRef}></datalist>
        </>
    )
}

export default SigmaGraph