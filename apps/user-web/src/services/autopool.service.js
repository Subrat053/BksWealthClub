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

  getOperationalAdminMyTree: async () => {
    try {
      const response = await userAxios.get(
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

  getMyPoolFundLedger: async () => {
    try {
      const response = await userAxios.get("/autopool/3x3/my/pool-fund");
      return response.data?.data || [];
    } catch (error) {
      console.error("Error fetching my pool fund ledger:", error);
      return [];
    }
  },
};
