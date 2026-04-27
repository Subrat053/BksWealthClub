import axiosInstance from "../utils/axiosInstance";

export const supportService = {
  // Create Support Ticket (Member)
  createTicket: (data) =>
    axiosInstance.post("/support", data),

  // Get Logged In User Tickets
  getMyTickets: () =>
    axiosInstance.get("/support/my"),

  // Get All Tickets (Admin)
  getAllTickets: (params = {}) =>
    axiosInstance.get("/support/admin/all", {
      params,
    }),

  // Get Single Ticket Details
  getTicketById: (id) =>
    axiosInstance.get(`/support/${id}`),

  // Reply to Ticket
  replyTicket: (id, data) =>
    axiosInstance.post(`/support/${id}/reply`, data),

  // Update Ticket Status (Admin)
  updateTicketStatus: (id, status) =>
    axiosInstance.patch(`/support/${id}/status`, {
      status,
    }),
};