import { adminApiClient } from "./deposit.service";

export const adminIncomeService = {
  // ─── Fund Summary ─────────────────────────────────────────────────────────
  getFundsSummary: () => adminApiClient("/api/v1/income/admin/funds-summary"),

  // ─── Fund Transactions ────────────────────────────────────────────────────
  getFundTransactions: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.page) params.set("page", filters.page);
    if (filters.limit) params.set("limit", filters.limit);
    if (filters.fundType) params.set("fundType", filters.fundType);
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    if (filters.userId) params.set("userId", filters.userId);
    if (filters.depositId) params.set("depositId", filters.depositId);
    const qs = params.toString();
    return adminApiClient(`/api/v1/income/admin/fund-transactions${qs ? `?${qs}` : ""}`);
  },

  // ─── Income Logs ──────────────────────────────────────────────────────────
  getIncomeLogs: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.page) params.set("page", filters.page);
    if (filters.limit) params.set("limit", filters.limit);
    if (filters.type) params.set("type", filters.type);
    const qs = params.toString();
    return adminApiClient(`/api/v1/income/admin/logs${qs ? `?${qs}` : ""}`);
  },

  // ─── User Income Summary ──────────────────────────────────────────────────
  getUserIncomeSummary: (userId) =>
    adminApiClient(`/api/v1/income/admin/user/${userId}/income-summary`),

  // ─── Users with Rebirths ──────────────────────────────────────────────────
  getUsersWithRebirths: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.status) params.set("status", filters.status);
    if (filters.type) params.set("type", filters.type);
    const qs = params.toString();
    return adminApiClient(`/api/v1/income/admin/users-with-rebirths${qs ? `?${qs}` : ""}`);
  },

  // ─── Deposit Distribution Detail ──────────────────────────────────────────
  getDepositDistribution: (depositId) =>
    adminApiClient(`/api/v1/income/admin/deposit/${depositId}/distribution`),

  // ─── Trigger Distribution (manual) ─────────────────────────────────────────
  triggerDistribution: (depositId) =>
    adminApiClient(`/api/v1/income/admin/distribute/${depositId}`, { method: "POST" }),
};
