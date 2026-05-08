const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5008";

export async function adminApiClient(url, options = {}) {
  const token = localStorage.getItem("adminToken");

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "API request failed");
  }

  return data;
}

export const depositService = {
  getPendingDeposits: () => {
    return adminApiClient("/api/v1/deposits/pending");
  },

  approveDeposit: (depositId) => {
    return adminApiClient(`/api/v1/deposits/${depositId}/approve`, {
      method: "PATCH",
    });
  },

  rejectDeposit: (depositId, reason) => {
    return adminApiClient(`/api/v1/deposits/${depositId}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    });
  },
};
