import { ApiError } from "../../core/ApiError.js";
import { supportRepository } from "./support.repository.js";

export const supportService = {
  createTicket: async ({ userId, payload }) =>
    supportRepository.createTicket({
      userRef: userId,
      subject: payload.subject,
      message: payload.message,
      status: "open",
    }),

  getMyTickets: async (userId) => supportRepository.getByUser(userId),

  getAllTickets: async () => supportRepository.getAll(),

  replyToTicket: async ({ ticketId, adminId, message }) => {
    const updated = await supportRepository.addReply(ticketId, {
      senderRole: "admin",
      senderRef: adminId,
      message,
      sentAt: new Date(),
    });

    if (!updated) throw new ApiError(404, "Ticket not found");
    return updated;
  },
};
