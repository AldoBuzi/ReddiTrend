import { useEffect, useRef } from 'react'
import Sigma from 'sigma'
import Graph from 'graphology'
import data from './data.json';

const SigmaGraph = () => {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Instantiate sigma:
        const graph = new Graph();
        graph.import(data);
        const renderer = new Sigma(graph, containerRef.current);

        const state = { searchQuery: "" };

        function setHoveredNode(node) {
            if (node) {
                state.hoveredNode = node;
                state.hoveredNeighbors = new Set(graph.neighbors(node));
            }

            if (!node) {
                state.hoveredNode = undefined;
                state.hoveredNeighbors = undefined;
            }

            // Refresh rendering
            renderer.refresh({
            // We don't touch the graph data so we can skip its reindexation
            skipIndexation: true,
            });
        }

        // Bind graph interactions:
        renderer.on("enterNode", ({ node }) => {
            setHoveredNode(node);
        });
        renderer.on("leaveNode", () => {
            setHoveredNode(undefined);
        });

        // Render nodes accordingly to the internal state:
        // 1. If a node is selected, it is highlighted
        // 2. If there is query, all non-matching nodes are greyed
        // 3. If there is a hovered node, all non-neighbor nodes are greyed
        renderer.setSetting("nodeReducer", (node, data) => {
            const res = { ...data };

            if (state.hoveredNeighbors && !state.hoveredNeighbors.has(node) && state.hoveredNode !== node) {
                res.label = "";
                res.color = "#f6f6f6";
            }

            if (state.selectedNode === node) {
                res.highlighted = true;
            } else if (state.suggestions) {
                if (state.suggestions.has(node)) {
                    res.forceLabel = true;
                } else {
                    res.label = "";
                    res.color = "#f6f6f6";
                }
            }

            return res;
        });

        // Render edges accordingly to the internal state:
        // 1. If a node is hovered, the edge is hidden if it is not connected to the
        //    node
        // 2. If there is a query, the edge is only visible if it connects two
        //    suggestions
        renderer.setSetting("edgeReducer", (edge, data) => {
            const res = { ...data };

            if (
                state.hoveredNode &&
                !graph.extremities(edge).every((n) => n === state.hoveredNode || graph.areNeighbors(n, state.hoveredNode))
            ) {
             res.hidden = true;
            }

            if (
                state.suggestions &&
                (!state.suggestions.has(graph.source(edge)) || !state.suggestions.has(graph.target(edge)))
            ) {
                res.hidden = true;
            }

            return res;
        });

        // State for drag'n'drop
        let draggedNode = null;
        let isDragging = false;

        // On mouse down on a node
        //  - we enable the drag mode
        //  - save in the dragged node in the state
        //  - highlight the node
        //  - disable the camera so its state is not updated
        renderer.on("downNode", (e) => {
            isDragging = true;
            draggedNode = e.node;
            graph.setNodeAttribute(draggedNode, "highlighted", true);
            if (!renderer.getCustomBBox()) renderer.setCustomBBox(renderer.getBBox());
        });

        // On mouse move, if the drag mode is enabled, we change the position of the draggedNode
        renderer.on("moveBody", ({ event }) => {
            if (!isDragging || !draggedNode) return;

            // Get new position of node
            const pos = renderer.viewportToGraph(event);

            graph.setNodeAttribute(draggedNode, "x", pos.x);
            graph.setNodeAttribute(draggedNode, "y", pos.y);

            // Prevent sigma to move camera:
            event.preventSigmaDefault();
            event.original.preventDefault();
            event.original.stopPropagation();
        });

        // On mouse up, we reset the dragging mode
        const handleUp = () => {
            if (draggedNode) {
            graph.removeNodeAttribute(draggedNode, "highlighted");
            }
            isDragging = false;
            draggedNode = null;
        };
        renderer.on("upNode", handleUp);
        renderer.on("upStage", handleUp);

        return () => {
            renderer.kill();
        };
    }, [])

    return <div className="d-flex justify-content-center mt-4">
        <div
            ref={containerRef}
            style={{ width: '800px', height: '600px', background: 'white' }}
        />
    </div>
}

export default SigmaGraph