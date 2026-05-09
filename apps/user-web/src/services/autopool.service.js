import userAxios from "./userAxios";

export const autopoolService = {
  getMyAutoPool: async () => {
    try {
      const response = await userAxios.get("/autopool/my");
      return response.data?.data || { entries: [], rebirths: [] };
    } catch (error) {
      console.error("Error fetching my autopool:", error);
      return { entries: [], rebirths: [] };
    }
  }
};
