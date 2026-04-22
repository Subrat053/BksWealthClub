import { apiClient } from "./apiClient";

export const incomeService = {
  getSponsorIncome: () => apiClient(() => []),
  getRepresentativeIncome: () => apiClient(() => []),
};
