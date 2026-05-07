// Normalize API base: prefer explicit VITE_API_BASE_URL, then VITE_API_URL, else default
let API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

// Ensure API_BASE_URL contains the API prefix `/api/v1` for consistency
const ensureApiPrefix = (base) => {
  const prefix = "/api/v1";
  if (base.endsWith(prefix)) return base.replace(/\/+$/, "");
  // strip trailing slash then append prefix
  return base.replace(/\/+$/, "") + prefix;
};

API_BASE_URL = ensureApiPrefix(API_BASE_URL);

export async function apiClient(urlOrFn, options = {}) {
  const defaultHeaders = {
    "Content-Type": "application/json",
  };

  // Add token if it exists
  const token = localStorage.getItem("userToken");
  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`;
  }

  const buildUrl = (input, base) => {
    if (typeof input === "function") return input();
    try {
      const u = new URL(input);
      return u.toString();
    } catch (e) {
      // relative path: combine without duplicating slashes
      return base.replace(/\/+$/, "") + input;
    }
  };

  // Candidate bases to try (primary + common fallbacks)
  const candidateBases = [API_BASE_URL];
  if (API_BASE_URL.includes("5008")) {
    candidateBases.push(API_BASE_URL.replace("5008", "5000"));
  } else if (API_BASE_URL.includes("5000")) {
    candidateBases.push(API_BASE_URL.replace("5000", "5008"));
  }

  let lastError = null;
  for (const base of candidateBases) {
    const target = buildUrl(urlOrFn, base);

    try {
      const response = await fetch(target, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      });

      let data = null;
      try {
        data = await response.json();
      } catch (e) {}

      if (!response.ok) {
        // if 404 try next candidate
        lastError = { status: response.status, data, message: data?.message };
        if (response.status === 404) continue;
        const message =
          data?.message || `API request failed (${response.status})`;
        const err = new Error(message);
        err.status = response.status;
        err.data = data;
        throw err;
      }

      return data;
    } catch (err) {
      lastError = err;
      // try next candidate
    }
  }

  // All candidates failed
  const finalMsg = lastError?.message || "API request failed (all attempts)";
  const finalErr = new Error(finalMsg);
  finalErr.data = lastError?.data || null;
  throw finalErr;
}
