import userAxios from "./userAxios";

export const autopoolService = {
  getMyAutoPool: async () => {
    try {
      const response = await userAxios.get("/autopool/3x3/my");
      return response.data?.data || { nodes: [], completions: [] };
    } catch (error) {
      console.error("Error fetching my autopool:", error);
      return { nodes: [], completions: [] };
    }
  },

  getMyPoolFundLedger: async () => {
    try {
      const response = await userAxios.get("/autopool/3x3/my/pool-fund");
      return response.data?.data || [];
    } catch (error) {
      console.error("Error fetching my pool fund ledger:", error);
      return [];
    }
  }
};
