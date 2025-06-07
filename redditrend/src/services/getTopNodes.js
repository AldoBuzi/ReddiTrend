
async function getTopNodes() {
    const response = await fetch("http://localhost:8080/top_nodes");

    if (!response.ok) {
        throw new Error("Error");
    }

    const data = await response.json();
    return data;
}

export default getTopNodes