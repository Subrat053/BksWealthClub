import { apiClient } from "./apiClient";

export const incomeService = {
  // ─── Wallet (includes withdrawableFund + rebirth balances) ──────────────
  getMyWallet: () => apiClient("/income/my-wallet"),

  // ─── Rebirth IDs ──────────────────────────────────────────────────────────
  getMyRebirthIds: () => apiClient("/income/my-rebirth-ids"),

  // ─── Income Logs ──────────────────────────────────────────────────────────
  getMyIncomeLogs: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.page) params.set("page", filters.page);
    if (filters.limit) params.set("limit", filters.limit);
    const qs = params.toString();
    return apiClient(`/income/my-logs${qs ? `?${qs}` : ""}`);
  },

  // ─── Legacy (preserved) ───────────────────────────────────────────────────
  getSponsorIncome: () => apiClient("/income/summary"),
  getRepresentativeIncome: () => apiClient("/income/history"),
};
