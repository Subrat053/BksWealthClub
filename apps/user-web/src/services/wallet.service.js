import { apiClient } from "./apiClient";

export const walletService = {
  getSummary: () => apiClient("/wallet/summary"),

  getLedger: (page = 1, limit = 50) => apiClient(`/wallet/ledger?page=${page}&limit=${limit}`),

  requestWithdrawal: (payload) =>
    apiClient("/wallet/withdraw-request", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  transfer: (payload) =>
    apiClient("/wallet/transfer", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getWithdrawalHistory: (page = 1, limit = 20) =>
    apiClient(`/wallet/withdraw-history?page=${page}&limit=${limit}`),

  getTransferHistory: (page = 1, limit = 20) =>
    apiClient(`/wallet/transfer-history?page=${page}&limit=${limit}`),
};
