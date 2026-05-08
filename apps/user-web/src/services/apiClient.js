let API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL;

// Ensure API_BASE_URL contains the API prefix `/api/v1`
const ensureApiPrefix = (base) => {
  if (!base) return "";
  const prefix = "/api/v1";
  if (base.endsWith(prefix)) return base.replace(/\/+$/, "");
  return base.replace(/\/+$/, "") + prefix;
};

API_BASE_URL = ensureApiPrefix(API_BASE_URL);

export async function apiClient(urlOrFn, options = {}) {
  const token = localStorage.getItem("userToken");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const path = typeof urlOrFn === "function" ? urlOrFn() : urlOrFn;
  const target = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;

  const response = await fetch(target, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}
