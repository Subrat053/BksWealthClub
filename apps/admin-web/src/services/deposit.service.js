import axiosInstance from "../utils/axiosInstance";

export async function adminApiClient(url, options = {}) {
  const response = await axiosInstance({
    url,
    ...options,
  });
  return response.data;
}

export const depositService = {
  getPendingDeposits: () => {
    return adminApiClient("/deposits/pending");
  },

  approveDeposit: (depositId) => {
    return adminApiClient(`/deposits/${depositId}/approve`, {
      method: "PATCH",
    });
  },

  rejectDeposit: (depositId, reason) => {
    return adminApiClient(`/deposits/${depositId}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    });
  },
};
