import { apiClient } from "./apiClient";

// export const supportService = {
//   createTicket: (payload) => apiClient(() => ({ ok: true, id: "t_001", ...payload })),
//   getTickets: () => apiClient(() => []),
// };

// src/services/support.service.js

export const supportService = {
  createTicket: (data) =>
    apiClient("/support", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getMyTickets: () => apiClient("/support/my"),

  getAllTickets: (params = {}) =>{
    const query = new URLSearchParams(params).toString();

    return apiClient(
      `/support/admin/all${query ? `?${query}` : ""}`
    );
  },
  
  getTicketById: (id) =>  apiClient(`/support/${id}`),

  replyTicket: (id, data) =>
    apiClient(`/support/${id}/reply`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateTicketStatus: (id, status) =>
    apiClient(`/support/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};
