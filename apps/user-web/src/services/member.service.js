import { apiClient } from "./apiClient";

export const memberService = {
  getDashboard: () =>
    apiClient(() => ({
      username: "GRW328370",
      status: "Inactive",
      sponsorIncome: 0,
      representativeIncome: 0,
      totalIncome: 0,
      wallets: { main: 0, fund: 0, holding: 0 },
    })),
  getProfile: () => apiClient(() => ({ name: "Demo Member", email: "member@example.com" })),
};
