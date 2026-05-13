import axiosInstance from "../utils/axiosInstance";

export const autopoolService = {
  getQueue: async () => {
    try {
      const response = await axiosInstance.get("/autopool/admin/queue");
      return response.data?.data || [];
    } catch (error) {
      console.error("Error fetching autopool queue:", error);
      return [];
    }
  },

  getTree: async () => {
    try {
      const response = await axiosInstance.get("/autopool/admin/tree");
      return response.data?.data || [];
    } catch (error) {
      console.error("Error fetching autopool tree:", error);
      return [];
    }
  },

  getStats: async () => {
    try {
      const response = await axiosInstance.get("/autopool/admin/stats");
      return response.data?.data || {
        totalEntries: 0,
        pendingEntries: 0,
        placedEntries: 0,
        completedEntries: 0,
        totalRebirths: 0,
        queueWaiting: 0,
        queueProcessing: 0,
      };
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
      const response = await axiosInstance.get(`/autopool/admin/user/${userId}`);
      return response.data?.data || { entries: [], rebirths: [] };
    } catch (error) {
      console.error("Error fetching user autopool detail:", error);
      return { entries: [], rebirths: [] };
    }
  },

  processQueue: async () => {
    try {
      const response = await axiosInstance.post("/autopool/admin/process-queue");
      return response.data;
    } catch (error) {
      console.error("Error processing autopool queue:", error);
      throw error;
    }
  }
};
