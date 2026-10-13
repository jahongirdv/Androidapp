const server = import.meta.env.VITE_API_SERVER;

export async function fetchData({
  body,
  method = 'GET',
  limit,
  endpoint = '',
} = {}) {
  let baseURL = server + '/api';

  let path = `/${endpoint}`;

  const dataURL = `${baseURL}${path}`;

  try {
    const response = await fetch(dataURL, {
      body: JSON.stringify(body),
      method,
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const data = await response.json();
    return data;
  } catch (err) {
    console.error('Fetch error:', err);
    return null;
  }
}
