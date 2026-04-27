// models/SupportTicket.js
// const mongoose = require("mongoose");
import mongoose from "mongoose";
const replySchema = new mongoose.Schema(
  {
    senderType: {
      type: String,
      enum: ["user", "admin"],
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const supportTicketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      unique: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: [
        "Account",
        "Payment",
        "Referral",
        "Income",
        "Withdrawal",
        "Technical",
        "Other",
      ],
      default: "Other",
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },

    status: {
      type: String,
      enum: ["Open", "In Progress", "Resolved", "Closed"],
      default: "Open",
    },

    replies: [replySchema],

    lastReplyBy: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  { timestamps: true }
);

supportTicketSchema.pre("save", async function (next) {
  if (!this.ticketId) {
    const count = await mongoose.model("SupportTicket").countDocuments();
    this.ticketId = `TKT-${String(count + 1).padStart(5, "0")}`;
  }
  next();
});

// module.exports = mongoose.model("SupportTicket", supportTicketSchema);
export const SupportTicket = mongoose.model("SupportTicket", supportTicketSchema);