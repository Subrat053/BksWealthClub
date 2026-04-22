import { apiClient } from "./apiClient";

export const supportService = {
  createTicket: (payload) => apiClient(() => ({ ok: true, id: "t_001", ...payload })),
  getTickets: () => apiClient(() => []),
};
