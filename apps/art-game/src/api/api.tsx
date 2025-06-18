export const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:8080";
export const websocketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || process.env.EXPO_PUBLIC_WEBSOCKET_URL || "ws://localhost:8083";

export const ipfsUrl = process.env.NEXT_PUBLIC_IPFS_URL || process.env.EXPO_PUBLIC_IPFS_URL || "https://ipfs.io/ipfs/";
const defaultHeaders = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
};

export const fetchJsonData = async (endpoint: string): Promise<any> => {
  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: defaultHeaders,
      mode: 'cors',
    });
    const jsonData = await response.json();
    const data = jsonData.data;
    return data;
  } catch (error) {
    console.error(`Error fetching data from ${endpoint}: ${error}`);
    return null;
  }
}

export const fetchArrayBuffer = async (endpoint: string): Promise<any> => {
  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: defaultHeaders,
      mode: 'cors',
    });
    const arrayBuffer = await response.arrayBuffer();
    return arrayBuffer;
  } catch (error) {
    console.error(`Error fetching data from ${endpoint}: ${error}`);
    return null;
  }
}

export const postJsonData = async (endpoint: string, data: any): Promise<any> => {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: defaultHeaders,
      mode: 'cors',
      body: JSON.stringify(data),
    });
    const jsonData = await response.json();
    return jsonData;
  } catch (error) {
    console.error(`Error posting data to ${endpoint}: ${error}`);
    return null;
  }
}
