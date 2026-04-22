import { apiClient } from "./apiClient";

export const withdrawalService = {
  requestWithdrawal: (payload) => apiClient(() => ({ ok: true, status: "pending", ...payload })),
  getHistory: () => apiClient(() => []),
};
