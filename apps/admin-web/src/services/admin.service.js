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
};
