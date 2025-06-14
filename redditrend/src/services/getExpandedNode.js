async function getExpandedNode(node, depth) {
    const response = await fetch(`http://fastapi-service:80/expand-node/${node}/${depth}`);

    if (!response.ok) {
        throw new Error("Error");
    }

    const data = await response.json();
    return data;
}

export default getExpandedNode