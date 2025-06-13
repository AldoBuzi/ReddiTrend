
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
    const [expandedNodeIds, setExpandedNodeIds] = useState(new Set());

    const [filters, setFilters] = useState({
        size: 1,
        degree: 1
    })

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
        const maxDistance = 80; // max distance from center for smallest nodes
        const maxSize = Math.max(...graphData.nodes.map(node => node.attributes.size));
        console.log(maxSize)
        graphRef.current.forEachNode((node, attrs) => {
            const size = attrs.size || 1;
            const sizeNorm = size / maxSize; // from 0 to 1

            // Distance is inverse of normalized size: bigger size → smaller distance
            const distance = maxDistance * (1 - sizeNorm);

            // Random angle around center
            const angle = Math.random() * 2 * Math.PI;

            // Compute x, y
            const x = center.x + (distance + Math.random() * 20) * Math.cos(angle);
            const y = center.y + (distance + Math.random() * 20) * Math.sin(angle);

            graphRef.current.setNodeAttribute(node, 'x', x);
            graphRef.current.setNodeAttribute(node, 'y', y);
        });

        forceAtlas2.assign(graphRef.current, {
            iterations: 10,
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
            setExpandedNodeIds(prevExpandedIds => {
                const newExpandedIds = new Set(prevExpandedIds);
                nodes.forEach(item => newExpandedIds.add(nodes.key))
                return newExpandedIds;
              });
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
        if (graphRef.current == null) return
        // Update existing nodes:
        graphData.nodes.forEach(newNode => {
            if (graphRef.current.hasNode(newNode.key)) {
                // Update node attributes
                graphRef.current.updateNodeAttributes(newNode.key, attrs => ({
                  ...attrs,
                  ...newNode.attributes, // overwrite attributes with newNode properties
                }));
              } else {
                // Add new node
                const size = newNode.attributes.size || 1;
                const sizeNorm = size / 100; // from 0 to 1

                // Distance is inverse of normalized size: bigger size → smaller distance
                const distance = 80 * (1 - sizeNorm);

                // Random angle around center
                const angle = Math.random() * 3 * Math.PI;

                // Compute x, y
                const x = (distance + Math.random() * 20 )  * Math.cos(angle);
                const y = (distance + Math.random() * 20 ) * Math.sin(angle);

                graphRef.current.addNode(newNode.key, {
                    ...newNode.attributes,
                    x: x,
                    y: y,
                });
            }
        });
        
        // Remove nodes not in graphData.nodes
        graphRef.current.forEachNode(nodeId => {
            if (!graphData.nodes.find(n => n.key === nodeId) && ! nodeId in expandedNodeIds) {
                graphRef.current.dropNode(nodeId);
              }
        });
        
        // Similarly for edges:
        graphData.edges.forEach(newEdge => {
            if (graphRef.current.hasEdge(newEdge.source, newEdge.target)) {
                graphRef.current.updateEdgeAttributes(newEdge.source, newEdge.target, attrs => ({
                  ...attrs,
                  ...newEdge,
                }));
              } else {
                graphRef.current.addDirectedEdge(newEdge.source, newEdge.target, newEdge);
              }
        });
        
        /*graphRef.current.forEachEdge((edgeId, attributes, source, target) => {
            if (!graphData.edges.find(e => e.source === source && e.target === target)) {
                graphRef.current.dropEdge(source, target);
              }
        });*/
        updateSuggesions()
        
        rendererRef.current.refresh();
      }, [graphData]);

    useEffect(() => {
        const container = containerRef.current;
        const searchInput = inputRef.current;
    
        // Initialize the graph
        const graph = new Graph({ multi: false, type: 'directed' });
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
                // only one match and matches exactly our query
                if (suggestions.length === 1 && suggestions[0].label === query) {
                    // set node as selected
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
                } 
                //multiple matches
                else {
                    currentState.selectedNode = undefined;
                    currentState.suggestions = new Set(suggestions.map(({ id }) => id));
                    //fix highlighted empty node when changing query
                    graph.forEachNode((node) => {
                        graph.setNodeAttribute(node, 'highlighted', false);
                    });
                    if (suggestions.length ==0) return
                    
                    const largestSuggestion = suggestions.reduce((maxNode, node) => {
                        const size = graph.getNodeAttribute(node.id, "size") || 0;
                        const maxSize = graph.getNodeAttribute(maxNode.id, "size") || 0;
                        return size > maxSize ? node : maxNode;
                    });
                    
                    currentState.selectedNode = largestSuggestion.id;
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
                        graph.forEachEdge((edge, attributes, source, target) => {
                            const isConnected =
                            source === currentState.selectedNode || target === currentState.selectedNode
                            if(isConnected){
                                console.log(isConnected)
                                console.log(source)
                                console.log(target)
                            }
                            console.log(currentState.selectedNode)
                            graph.setEdgeAttribute(edge, 'highlighted', isConnected);
                            if (!graph.getNodeAttribute(source,'highlighted'))
                                graph.setNodeAttribute(source, 'highlighted', isConnected);
                            if (!graph.getNodeAttribute(target,'highlighted'))
                                graph.setNodeAttribute(target, 'highlighted', isConnected);
                        });
                    }
                }
            } else {
                currentState.selectedNode = undefined;
                currentState.suggestions = undefined;
            }
        
            // This line gives error for some reason i don't know
            rendererRef.current.refresh();
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
            console.log("node", )
            graph.setNodeAttribute(node, "color", darkenColor(nodeColor, 20))
        });

        renderer.on("upNode", ({ node }) => {
            clearTimeout(longClickNodeTimer);
            graph.setNodeAttribute(node, "size", clickedNodeSizeRef.current)
            graph.setNodeAttribute(node, "color", clickedNodeColorRef.current)
            clickedNodeSizeRef.current = null
        });
    
        renderer.setSetting("nodeReducer", (node, data) => {
            const res = { ...data };
            const currentState = state.current;
            res.size = res.size * 1.5;
            if (
                currentState.hoveredNeighbors &&
                !currentState.hoveredNeighbors.has(node) &&
                currentState.hoveredNode !== node && 
                ! graph.getNodeAttribute(node,'highlighted')
            ) {
                res.label = "";
                res.color = "#f6f6f6";
            }
        
            if (currentState.selectedNode === node) {
                res.highlighted = true;
            } 
            else if (currentState.suggestions) {
                if (currentState.suggestions.has(node) || graph.getNodeAttribute(node,'highlighted')) {
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
            if (graph.getEdgeAttribute(edge, 'highlighted')) {
                return {
                  ...data,
                  color: '#ccc',
                  size: 3,
                };
            }
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
        console.log(clickedNode)
        setShowNodeInfo(!isEmpty(clickedNode))
    }, [clickedNode])

    function filterGraph(size, degree) {
        graphRef.current.forEachNode((node, attributes) => {
            const hidden = (size !== 1 && attributes.size < filterNodeBySizeValue) || (degree !== 1 && graphRef.current.outDegree(node) < filterNodeByDegreeValue)
            graphRef.current.setNodeAttribute(node, "hidden", hidden);
        });
    }

    function handleFilterNodeBySize(value) {
        setFilters(prev => ({
            ...prev,
            size: value
        }))

        setShowFilterNodeBySizeMenu(false)
    }

    function handleFilterNodeByDegree(value) {
        setFilters(prev => ({
            ...prev,
            degree: value
        }))

        setShowFilterNodeByDegreeMenu(false)
    }

    useEffect(() => {
        filterGraph(filters.size, filters.degree)
        updateSuggesions()
    }, [filters])

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
                    <Button className="ms-auto" variant="secondary" onClick={() => handleFilterNodeBySize(filterNodeBySizeValue)}>Filter</Button>
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
                    <Button className="ms-auto" variant="secondary" onClick={() => handleFilterNodeByDegree(filterNodeByDegreeValue)}>Filter</Button>
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
                    <Row className="d-flex align-items-center">
                        <Col xs="auto">
                            <Dropdown>
                                <Dropdown.Toggle style={{ "backgroundColor": "transparent", "border": "none" }}>
                                    <i class="bi bi-sliders text-black"></i>
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
                        </Col>
                        <Col className="d-flex ps-0 gap-2">
                            {filters.size !== 1 && <div className="d-flex gap-2 align-items-center py-1 px-2" style={{ "height": "max-content", "width": "max-content", "borderRadius": "50px", "backgroundColor": "#CCCCCC" }}>
                                <p className="m-0" style={{ "fontSize": "0.75rem"}}>size {filters.size}</p>
                                <CloseButton style={{ width: '0.25rem', height: '0.25rem', backgroundSize: 'auto' }} onClick={() => handleFilterNodeBySize(1)} />
                            </div>}
                            {filters.degree !== 1 && <div className="d-flex gap-2 align-items-center py-1 px-2" style={{ "height": "max-content", "width": "max-content", "borderRadius": "50px", "backgroundColor": "#CCCCCC" }}>
                                <p className="m-0" style={{ "fontSize": "0.75rem"}}>degree {filters.degree}</p>
                                <CloseButton style={{ width: '0.25rem', height: '0.25rem', backgroundSize: 'auto' }} onClick={() => handleFilterNodeByDegree(1)} />
                            </div>}
                        </Col>
                    </Row>
                </Col>
            </div>
            <datalist id="suggestions" ref={suggestionsRef}></datalist>
            {showNodeInfo && (() => {
                const normalizedSentiment = Math.round((clickedNode.sentiment + 1) * 50); // Range 0–100
                return (
                    <div
                        className="position-absolute bg-white m-5 rounded-4 p-3 overflow-auto"
                        style={{ border: "2px solid #CCCCCC", maxWidth: "25%", maxHeight: "50%" }}
                    >
                        <h3>Info: {clickedNode.label}</h3>
                        <h5 className="mb-3">Sentiment: {normalizedSentiment > 67 && <>🟢</>}
                        {normalizedSentiment <= 67 && normalizedSentiment >= 33 && <>🟡</>}
                        {normalizedSentiment < 33 && <>🔴</>}
                        {' '}{normalizedSentiment}%</h5>
                        <h6>Posts:</h6>
                        <div className="d-flex gap-3 flex-column-reverse">
                        {clickedNode.posts.map((post, index) => {
                            const postSentiment = Math.round((post.sentiment + 1) * 50);
                            return (
                                <div
                                    key={index}
                                    className="rounded-4 p-3"
                                    style={{ backgroundColor: "#EEEEEE" }}
                                >
                                    <h6><strong>Title: </strong>{post.title}
                                        <a href={post.link} target="_blank">
                                            <i className="ms-1 bi bi-link-45deg"></i>
                                        </a>
                                    </h6>
                                    <h6><strong>Subreddit: </strong>{post.subreddit}</h6>
                                    <h6><strong>Karma: </strong>{post.karma}</h6>
                                    <h6><strong>Sentiment: </strong>{postSentiment > 67 && <>🟢</>}
                                    {postSentiment <= 67 && postSentiment >= 33 && <>🟡</>}
                                    {postSentiment < 33 && <>🔴</>}
                                    {' '}{postSentiment}%
                                    </h6>
                                </div>
                            );
                        })}
                        </div>
                        <CloseButton className="position-absolute m-3 end-0 top-0" onClick={() => {setShowNodeInfo(false); setClickedNode({})}} />
                    </div>
                );
            })()}
        </>
    )
}
export default SigmaGraph