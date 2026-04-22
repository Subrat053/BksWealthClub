import mongoose from "mongoose";

const depositSchema = new mongoose.Schema(
  {
    userRef: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true },
    walletType: { type: String, default: "USDT" },
    txHash: { type: String, default: "" },
    proof: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    reviewReason: { type: String, default: "" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true },
);

export const DepositModel = mongoose.models.Deposit || mongoose.model("Deposit", depositSchema);
