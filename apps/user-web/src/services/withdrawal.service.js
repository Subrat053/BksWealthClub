import { apiClient } from "./apiClient";

export const withdrawalService = {
  requestWithdrawal: (payload) =>
    apiClient("/withdrawals", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getHistory: () =>
    apiClient("/withdrawals/mine", {
      method: "GET",
    }),
};
