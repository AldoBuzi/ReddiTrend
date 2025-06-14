async function getExpandedNode(node, depth) {
    const response = await fetch(`http://localhost:8000/expand-node/${node}/${depth}`);

    if (!response.ok) {
        throw new Error("Error");
    }

    const data = await response.json();
    return data;
}

export default getExpandedNode