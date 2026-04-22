export const teamService = {
  getDirectTeam: async ({ userId, query }) => ({
    userId,
    filters: query,
    rows: [],
    summary: { total: 0, active: 0, inactive: 0 },
  }),

  getGenerationTeam: async ({ userId, query }) => ({
    userId,
    filters: query,
    rows: [],
    summary: { total: 0 },
  }),

  getHierarchy: async ({ userId }) => ({
    userId,
    nodes: [],
    edges: [],
  }),
};
