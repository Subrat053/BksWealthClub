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

  getMyAutoPoolSummary: async () => {
    try {
      const response = await userAxios.get("/autopool/3x3/my/summary");
      return response.data?.data || { stats: {}, rebirths: { count: 0, rebirths: [] }, nodes: [] };
    } catch (error) {
      console.error("Error fetching my autopool summary:", error);
      return { stats: {}, rebirths: { count: 0, rebirths: [] }, nodes: [] };
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

  getMyFunds: async () => {
    try {
      const response = await userAxios.get("/autopool/3x3/my/funds");
      return response.data?.data || {
        completedAutopoolLevel: 0,
        poolFundTotal: 0,
        reinvestmentFundTotal: 0,
        withdrawableAutopoolFund: 0,
        upgradeIdCount: 0,
        upgradeDeductionTotal: 0,
        lastCompletedRound: -1,
      };
    } catch (error) {
      console.error("Error fetching my isolated funds:", error);
      return {
        completedAutopoolLevel: 0,
        poolFundTotal: 0,
        reinvestmentFundTotal: 0,
        withdrawableAutopoolFund: 0,
        upgradeIdCount: 0,
        upgradeDeductionTotal: 0,
        lastCompletedRound: -1,
      };
    }
  },

  getMyFundTransactions: async () => {
    try {
      const response = await userAxios.get("/autopool/3x3/my/fund-transactions");
      return response.data?.data || [];
    } catch (error) {
      console.error("Error fetching my fund transactions:", error);
      return [];
    }
  },

  getMyUpgradeIds: async () => {
    try {
      const response = await userAxios.get("/autopool/3x3/my/upgrade-ids");
      return response.data?.data || [];
    } catch (error) {
      console.error("Error fetching my upgrade IDs:", error);
      return [];
    }
  },

  getMyAutoPoolDetails: async () => {
    try {
      const response = await userAxios.get("/autopool/3x3/my/details");
      return response.data?.data || null;
    } catch (error) {
      console.error("Error fetching my autopool details:", error);
      return null;
    }
  },

  getMyAutoPoolTree: async () => {
    try {
      const response = await userAxios.get("/autopool/3x3/my/tree");
      return response.data?.data || [];
    } catch (error) {
      console.error("Error fetching my autopool tree:", error);
      return [];
    }
  },
};
