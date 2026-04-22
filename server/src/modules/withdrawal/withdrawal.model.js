import mongoose from "mongoose";

const withdrawalSchema = new mongoose.Schema(
  {
    userRef: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true },
    chargePercent: { type: Number, default: 0 },
    chargeAmount: { type: Number, default: 0 },
    payableAmount: { type: Number, required: true },
    walletAddress: { type: String, required: true },
    status: { type: String, enum: ["pending", "approved", "rejected", "processed"], default: "pending" },
    reason: { type: String, default: "" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true },
);

export const WithdrawalModel = mongoose.models.Withdrawal || mongoose.model("Withdrawal", withdrawalSchema);
