import { SupportTicketModel } from "./support.model.js";

export const supportRepository = {
  createTicket: async (payload) => SupportTicketModel.create(payload),
  getByUser: async (userRef) => SupportTicketModel.find({ userRef }).sort({ createdAt: -1 }).lean(),
  getAll: async () => SupportTicketModel.find({}).sort({ createdAt: -1 }).lean(),
  addReply: async (id, payload) =>
    SupportTicketModel.findByIdAndUpdate(
      id,
      {
        $push: { replies: payload },
        $set: { responseAt: new Date(), status: "in_progress" },
      },
      { new: true },
    ).lean(),
};
