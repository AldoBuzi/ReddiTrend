
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

async function getTopNodes() {
    const response = await fetch(`${API_URL}/api/top-nodes`);

    if (!response.ok) {
        throw new Error("Error");
    }

    const data = await response.json();
    return data;
}

export default getTopNodes