import mongoose from "mongoose";

const supportReplySchema = new mongoose.Schema(
  {
    senderRole: { type: String, enum: ["user", "admin"], required: true },
    senderRef: { type: mongoose.Schema.Types.ObjectId, refPath: "senderRole" },
    message: { type: String, required: true },
    sentAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const supportTicketSchema = new mongoose.Schema(
  {
    userRef: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ["open", "in_progress", "resolved", "closed"], default: "open" },
    replies: { type: [supportReplySchema], default: [] },
    submittedAt: { type: Date, default: Date.now },
    responseAt: { type: Date },
  },
  { timestamps: true },
);

export const SupportTicketModel =
  mongoose.models.SupportTicket || mongoose.model("SupportTicket", supportTicketSchema);
