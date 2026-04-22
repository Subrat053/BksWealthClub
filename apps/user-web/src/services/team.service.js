import { apiClient } from "./apiClient";

export const teamService = {
  getDirectTeam: () => apiClient(() => []),
  getGenerationTeam: () => apiClient(() => []),
  getAutopoolTree: () =>
    apiClient(() => ({
      root: "GRW328370",
      levels: [["A1", "A2"], ["B1", "B2", "B3", "B4"]],
    })),
};
