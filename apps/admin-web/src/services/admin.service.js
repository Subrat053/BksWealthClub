import axiosInstance from "../utils/axiosInstance";

export const adminService = {
  getDashboardSummary: async () => {
    try {
      const response = await axiosInstance.get("/admin/summary");
      return (
        response.data?.data || {
          users: 0,
          pendingDeposits: 0,
          pendingWithdrawals: 0,
          openTickets: 0,
          recentActivities: [],
        }
      );
    } catch (error) {
      console.error("Error fetching dashboard summary:", error);
      return {
        users: 0,
        pendingDeposits: 0,
        pendingWithdrawals: 0,
        openTickets: 0,
        recentActivities: [],
      };
    }
  },

  getUsers: async () => {
    try {
      const response = await axiosInstance.get("/admin/users");
      return response.data?.data || [];
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  },

  // ─── Withdrawal Actions ───────────────────────────────────────────────────
  getWithdrawals: async ({ page = 1, limit = 50, status = "", search = "" } = {}) => {
    try {
      const params = new URLSearchParams();
      params.set("page", page);
      params.set("limit", limit);
      if (status) params.set("status", status);
      if (search) params.set("search", search);
      
      const response = await axiosInstance.get(`/admin/withdrawals?${params.toString()}`);
      return response.data?.data || { requests: [], total: 0, totalPages: 1 };
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
      throw error;
    }
  },

  approveWithdrawal: async (id) => {
    try {
      const response = await axiosInstance.patch(`/admin/withdrawals/${id}/approve`);
      return response.data;
    } catch (error) {
      console.error("Error approving withdrawal:", error);
      throw error;
    }
  },

  rejectWithdrawal: async (id, reason) => {
    try {
      const response = await axiosInstance.patch(`/admin/withdrawals/${id}/reject`, { reason });
      return response.data;
    } catch (error) {
      console.error("Error rejecting withdrawal:", error);
      throw error;
    }
  },

  markPaidWithdrawal: async (id, { txHash, adminNote }) => {
    try {
      const url = id ? `/admin/withdrawals/${id}/mark-paid` : `/admin/mark-paid`;
      const res = await axiosInstance.patch(url, { id, txHash, adminNote });
      return res.data;
    } catch (error) {
      console.error("Error marking withdrawal as paid:", error);
      throw error;
    }
  },

  // ─── Transfer Actions ─────────────────────────────────────────────────────
  getWalletTransfers: async ({ page = 1, limit = 50, search = "" } = {}) => {
    try {
      const params = new URLSearchParams();
      params.set("page", page);
      params.set("limit", limit);
      if (search) params.set("search", search);
      
      const response = await axiosInstance.get(`/admin/wallet-transfers?${params.toString()}`);
      return response.data?.data || { transfers: [], total: 0, totalPages: 1 };
    } catch (error) {
      console.error("Error fetching wallet transfers:", error);
      throw error;
    }
  },
};
