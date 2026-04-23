const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5008";

export async function apiClient(url, options = {}) {
  const defaultHeaders = {
    "Content-Type": "application/json",
  };

  // Add token if it exists
  const token = localStorage.getItem("authToken");
  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "API request failed");
  }

  return data;
}
