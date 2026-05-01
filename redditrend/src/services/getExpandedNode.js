const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

async function getExpandedNode(node, depth) {
    const response = await fetch(`${API_URL}/api/expand-node/${node}/${depth}`);

    if (!response.ok) {
        throw new Error("Error");
    }

    const data = await response.json();
    return data;
}

export default getExpandedNode