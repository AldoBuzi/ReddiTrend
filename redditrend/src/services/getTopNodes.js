
async function getTopNodes() {
    const response = await fetch("http://fastapi-service:80/top-nodes");

    if (!response.ok) {
        throw new Error("Error");
    }

    const data = await response.json();
    return data;
}

export default getTopNodes