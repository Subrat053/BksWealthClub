import mongoose from "mongoose";

const walletTransferSchema = new mongoose.Schema(
  {
    senderUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    receiverUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["SUCCESS", "FAILED"],
      default: "SUCCESS",
    },
    senderBalanceAfter: { type: Number, required: true },
    receiverBalanceAfter: { type: Number, required: true },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

export const WalletTransferModel = mongoose.models.WalletTransfer || mongoose.model("WalletTransfer", walletTransferSchema);
