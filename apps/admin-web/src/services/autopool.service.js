import axiosInstance from "../utils/axiosInstance";

export const autopoolService = {
  getQueue: async (page = 1, limit = 100, search = "") => {
    try {
      const response = await axiosInstance.get("/autopool/3x3/admin/queue", {
        params: { page, limit, search }
      });
      return {
        data: response.data?.data || [],
        meta: response.data?.meta || { total: 0, page: 1, limit: 100, totalPages: 1 }
      };
    } catch (error) {
      console.error("Error fetching autopool queue:", error);
      return { data: [], meta: { total: 0, page: 1, limit: 100, totalPages: 1 } };
    }
  },

  getTree: async (limit = 100) => {
    try {
      const response = await axiosInstance.get("/autopool/3x3/admin/tree", {
        params: { limit }
      });
      return response.data?.data || [];
    } catch (error) {
      console.error("Error fetching autopool tree:", error);
      return [];
    }
  },

  getOperationalAdminMyTree: async () => {
    try {
      const response = await axiosInstance.get(
        "/autopool/operational-admin/my-tree",
      );
      return (
        response.data?.data || {
          admin: null,
          nodes: [],
          completions: [],
          summary: {},
        }
      );
    } catch (error) {
      console.error("Error fetching operational admin autopool tree:", error);
      return { admin: null, nodes: [], completions: [], summary: {} };
    }
  },

  getStats: async () => {
    try {
      const response = await axiosInstance.get("/autopool/3x3/admin/stats");
      return (
        response.data?.data || {
          totalEntries: 0,
          pendingEntries: 0,
          placedEntries: 0,
          completedEntries: 0,
          totalRebirths: 0,
          queueWaiting: 0,
          queueProcessing: 0,
        }
      );
    } catch (error) {
      console.error("Error fetching autopool stats:", error);
      return {
        totalEntries: 0,
        pendingEntries: 0,
        placedEntries: 0,
        completedEntries: 0,
        totalRebirths: 0,
        queueWaiting: 0,
        queueProcessing: 0,
      };
    }
  },

  getUserDetail: async (userId) => {
    try {
      const response = await axiosInstance.get(
        `/autopool/3x3/admin/user/${userId}`,
      );
      return response.data?.data || { entries: [], rebirths: [] };
    } catch (error) {
      console.error("Error fetching user autopool detail:", error);
      return { entries: [], rebirths: [] };
    }
  },

  processQueue: async () => {
    try {
      const response = await axiosInstance.post(
        "/autopool/3x3/admin/process-queue",
      );
      return response.data;
    } catch (error) {
      console.error("Error processing autopool queue:", error);
      throw error;
    }
  },

  getPoolFundSummary: async () => {
    try {
      const response = await axiosInstance.get(
        "/autopool/3x3/admin/pool-fund-summary",
      );
      return response.data?.data || null;
    } catch (error) {
      console.error("Error fetching pool fund summary:", error);
      return null;
    }
  },

  getPoolFundLedger: async (params) => {
    try {
      const response = await axiosInstance.get(
        "/autopool/3x3/admin/pool-fund-ledger",
        { params },
      );
      return response.data?.data || { ledger: [], pagination: {} };
    } catch (error) {
      console.error("Error fetching pool fund ledger:", error);
      return { ledger: [], pagination: {} };
    }
  },

  getUserPoolFund: async (userId) => {
    try {
      const response = await axiosInstance.get(
        `/autopool/3x3/admin/user-pool-fund/${userId}`
      );
      return response.data?.data || [];
    } catch (error) {
      console.error("Error fetching user pool fund:", error);
      return [];
    }
  },

  getIndividualSummary: async (params) => {
    try {
      const response = await axiosInstance.get(
        "/autopool/3x3/admin/individuals",
        { params }
      );
      return response.data?.data || { users: [], pagination: {} };
    } catch (error) {
      console.error("Error fetching individual autopool summary:", error);
      return { users: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 1 } };
    }
  },

  getIndividualDetails: async (userId) => {
    try {
      const response = await axiosInstance.get(
        `/autopool/3x3/admin/individuals/${userId}`
      );
      return response.data?.data || null;
    } catch (error) {
      console.error("Error fetching individual autopool details:", error);
      return null;
    }
  },

  getIndividualTree: async (userId) => {
    try {
      const response = await axiosInstance.get(
        `/autopool/3x3/admin/individuals/${userId}/tree`
      );
      return response.data?.data || [];
    } catch (error) {
      console.error("Error fetching individual autopool tree:", error);
      return [];
    }
  },
};
