
import { useEffect, useRef, useState, useCallback, useContext, lazy } from 'react'
import Sigma from 'sigma'
import Graph from 'graphology'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import forceAtlas2 from 'graphology-layout-forceatlas2';
import { DarkModeContext } from '../App'
import Offcanvas from 'react-bootstrap/Offcanvas';
import isEmpty from '../utils/isEmpty'
import getExpandedNode from '../services/getExpandedNode'
import darkenColor from '../utils/darkenColor'
import Dropdown from 'react-bootstrap/Dropdown';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import CloseButton from 'react-bootstrap/CloseButton';

function SigmaGraph({ graphData }) {
    const darkMode = useContext(DarkModeContext)

    const containerRef = useRef(null);
    const inputRef = useRef(null);
    const suggestionsRef = useRef(null);
    const rendererRef = useRef(null);
    const graphRef = useRef(null);

    const [showFilterNodeBySizeMenu, setShowFilterNodeBySizeMenu] = useState(false)
    const [showFilterNodeByDegreeMenu, setShowFilterNodeByDegreeMenu] = useState(false)

    const [filterNodeBySizeValue, setFilterNodeBySizeValue] = useState(1)
    const [filterNodeByDegreeValue, setFilterNodeByDegreeValue] = useState(1)

    const state = useRef({
        hoveredNode: undefined,
        searchQuery: "",
        selectedNode: undefined,
        suggestions: undefined,
        hoveredNeighbors: undefined,
    });

    const animationRef = useRef(null);
    const zoomingNodeRef = useRef(null);
    
    const clickedNodeSizeRef = useRef(null)
    const clickedNodeColorRef = useRef(null)

    const [clickedNode, setClickedNode] = useState({})

    const [showNodeInfo, setShowNodeInfo] = useState(false);

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

    function handleLongClickNode(nodeId) {
        const depth = 1;

        getExpandedNode(nodeId, depth).then(({ nodes, edges }) => {
            expandNode(nodeId, nodes, edges);
        }).catch(error => alert(error))
    }
    
    function expandNode(rootNodeId, newNodes, newEdges) {
        const rootNode = graphRef.current.getNodeAttributes(rootNodeId);
        const angleStep = (2 * Math.PI) / newNodes.length;
        let index = 0;

        newNodes.forEach((newNode) => {
          if (!graphRef.current.hasNode(newNode.key)) {
            const radius = 10;
            const angle = index * angleStep;

            const xNewNode = rootNode.x + radius * Math.cos(angle);
            const yNewNode = rootNode.y + radius * Math.sin(angle);

            graphRef.current.addNode(newNode.key, {
                ...newNode.attributes,
                x: xNewNode,
                y: yNewNode,
            });

            index++;
          }
        });

        updateSuggesions()

        newEdges.forEach((newEdge) => {
            if (!graphRef.current.hasEdge(newEdge.source, newEdge.target)) {
                graphRef.current.addDirectedEdge(newEdge.source, newEdge.target, newEdge);
            }
        });
    }

    function updateSuggesions() {
        suggestionsRef.current.innerHTML = graphRef.current
            .nodes()
            .map(
                (node) => 
                graphRef.current.getNodeAttribute(node, "hidden") ? "" : `<option value="${graphRef.current.getNodeAttribute(node, "label")}"></option>`
            )
            .join("\n");
    }

    useEffect(() => {
        const container = containerRef.current;
        const searchInput = inputRef.current;
    
        // Initialize the graph
        const graph = new Graph({ multi: true, type: 'directed' });
        graph.import(graphData);
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
        updateSuggesions()
    
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

                    const isNodeHidden = graph.getNodeAttribute(currentState.selectedNode, "hidden")

                    if (nodePosition && !isNodeHidden) {
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
            container.style.cursor = "pointer";
        });

        renderer.on("clickNode", ({ node }) => {
            setClickedNode(graph.getNodeAttributes(node))
        });

        let longClickNodeTimer = null;
        let longPressDuration = 1000; 

        renderer.on("leaveNode", () => {
            setHoveredNode(undefined);
            container.style.cursor = "default";
            clearTimeout(longClickNodeTimer);
        });

        renderer.on("downNode", ({ node }) => {
            longClickNodeTimer = setTimeout(() => {
                cancelAnimationFrame(animationRef.current)
                handleLongClickNode(node);
            }, longPressDuration);

            const nodeSize = graph.getNodeAttributes(node).size
            const nodeColor = graph.getNodeAttributes(node).color
            clickedNodeSizeRef.current = nodeSize
            clickedNodeColorRef.current = nodeColor
            graph.setNodeAttribute(node, "size", nodeSize * 1.1)
            console.log("nodeColor", nodeColor)
            graph.setNodeAttribute(node, "color", darkenColor(nodeColor, 20))
        });

        renderer.on("upNode", ({ node }) => {
            clearTimeout(longClickNodeTimer);
            graph.setNodeAttribute(node, "size", clickedNodeSizeRef.current)
            graph.setNodeAttribute(node, "color", clickedNodeColorRef.current)
            clickedNodeSizeRef.curren = null
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
    }, []);

    useEffect(() => {
        setShowNodeInfo(!isEmpty(clickedNode))
    }, [clickedNode])

    function handleFilterNodeBySize() {
        graphRef.current.forEachNode((node, attributes) => {
            if (attributes.size < filterNodeBySizeValue) {
                graphRef.current.setNodeAttribute(node, "hidden", true);
            } else {
                graphRef.current.setNodeAttribute(node, "hidden", false);
            }
        });

        updateSuggesions()
        setShowFilterNodeBySizeMenu(false)
    }

    function handleFilterNodeByDegree() {
        graphRef.current.forEachNode((node) => {
            graphRef.current.setNodeAttribute(node, "hidden", graphRef.current.outDegree(node) < filterNodeByDegreeValue);
        });

        updateSuggesions()
        setShowFilterNodeByDegreeMenu(false)
    }

    return (<>
            {showFilterNodeBySizeMenu && <div
                className="w-25 position-absolute top-50 start-50 translate-middle bg-white z-1 p-3 rounded-4"
                style={{ "border": "2px solid #CCCCCC" }}
            >
                <Form.Label>Minimum Size: {filterNodeBySizeValue}</Form.Label>
                <Form.Range min={1}
                    max={10}
                    step={1}
                    value={filterNodeBySizeValue}
                    onChange={(e) => setFilterNodeBySizeValue(e.target.value)}/>
                <div className="d-flex">
                    <Button className="ms-auto" variant="secondary" onClick={handleFilterNodeBySize}>Filter</Button>
                </div>
                <CloseButton className="position-absolute m-3 end-0 top-0"  onClick={() => setShowFilterNodeBySizeMenu(false)} />
            </div>}
            {showFilterNodeByDegreeMenu && <div
                className="w-25 position-absolute top-50 start-50 translate-middle bg-white z-1 p-3 rounded-4"
                style={{ "border": "2px solid #CCCCCC" }}
            >
                <Form.Label>Minimum Degree: {filterNodeByDegreeValue}</Form.Label>
                <Form.Range min={1}
                    max={10}
                    step={1}
                    value={filterNodeByDegreeValue}
                    onChange={(e) => setFilterNodeByDegreeValue(e.target.value)}/>
                <div className="d-flex">
                    <Button className="ms-auto" variant="secondary" onClick={handleFilterNodeByDegree}>Filter</Button>
                </div>
                <CloseButton className="position-absolute m-3 end-0 top-0"  onClick={() => setShowFilterNodeByDegreeMenu(false)} />
            </div>}
            <div
                id="sigma-container"
                ref={containerRef}
                className="position-absolute top-50 start-50 translate-middle h-100 w-100"
                style={{ }}
            />
            <div
                className="position-absolute bottom-0 start-50 translate-middle-x w-50 p-3 rounded-4 mb-5 bg-white"
                style={{ "border": "2px solid #CCCCCC" }}
            >
                <Col className="d-flex flex-column gap-3">
                    <Row>
                        <input
                            ref={inputRef}
                            id="search-input"
                            list="suggestions"
                            placeholder="Search node"
                            style={{ "backgroundColor": `${ darkMode ? "#292c35" : "" }`, "border": "none", "outline": "none" }}
                            className={`${ darkMode ? "text-white" : "" } px-3`}
                        />
                    </Row>
                    <Row>
                        <Dropdown>
                            <Dropdown.Toggle style={{ "backgroundColor": "transparent", "border": "none" }}>
                                <i class="bi bi-filter-left text-black"></i>
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                                <Dropdown.Item href="#/action-1" onClick={() => setShowFilterNodeBySizeMenu(true)}>
                                    Size
                                </Dropdown.Item>
                                <Dropdown.Item href="#/action-2" onClick={() => setShowFilterNodeByDegreeMenu(true)}>
                                    Degree
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </Row>
                </Col>
            </div>
            <datalist id="suggestions" ref={suggestionsRef}></datalist>
            {showNodeInfo && <div
                className="position-absolute bg-white m-5 rounded-4 p-3"
                style={{ border: "2px solid #CCCCCC", "maxWidth": "50%"}}
            >
                <strong>Keyword:</strong> {clickedNode.label}<br />
                <strong>Sentiment:</strong> {Math.round((clickedNode.sentiment + 1) * 50)}%<br />
                <strong>Posts:</strong>
                <ul>
                    {clickedNode.posts.map((post) => (
                        <li>{post.title}</li>
                    ))}
                </ul>
                <CloseButton className="position-absolute m-3 end-0 top-0" onClick={() => setShowNodeInfo(false)} />
            </div>}
        </>
    )
}
export default SigmaGraph