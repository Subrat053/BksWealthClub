import mongoose from "mongoose";

const withdrawalRequestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    requestedAmount: { type: Number, required: true },
    adminChargePercent: { type: Number, default: 5 },
    adminChargeAmount: { type: Number, required: true },
    totalDebit: { type: Number, required: true },
    walletAddress: { type: String, required: true },
    network: { type: String, required: true },
    status: {
      type: String,
      enum: [
        "PENDING_ADMIN_APPROVAL",
        "APPROVED",
        "REJECTED",
        "PAID",
        "FAILED",
      ],
      default: "PENDING_ADMIN_APPROVAL",
      index: true,
    },
    txHash: { type: String, default: "" },
    userNote: { type: String, default: "" },
    adminNote: { type: String, default: "" },
    rejectionReason: { type: String, default: "" },
    requestedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },
    paidAt: { type: Date },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true }
);

export const WithdrawalRequestModel = mongoose.models.WithdrawalRequest || mongoose.model("WithdrawalRequest", withdrawalRequestSchema);
