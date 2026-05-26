import mongoose from "mongoose";

const walletLedgerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: [
        "AUTOPOOL_WITHDRAWABLE_CREDIT",
        "SPONSOR_INCOME_CREDIT",
        "LEVEL_INCOME_CREDIT",
        "ALIAS_DEDUCTION",
        "WITHDRAWAL_LOCK",
        "WITHDRAWAL_APPROVED",
        "WITHDRAWAL_PAID",
        "WITHDRAWAL_REJECTED_UNLOCK",
        "WITHDRAWAL_ADMIN_CHARGE",
        "WALLET_TRANSFER_SENT",
        "WALLET_TRANSFER_RECEIVED",
        "ADMIN_ADJUSTMENT",
      ],
      required: true,
    },
    direction: {
      type: String,
      enum: ["CREDIT", "DEBIT", "LOCK", "UNLOCK"],
      required: true,
    },
    amount: { type: Number, required: true },
    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    sourceId: { type: String, default: "" },
    sourceType: { type: String, default: "" },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

export const WalletLedgerModel = mongoose.models.WalletLedger || mongoose.model("WalletLedger", walletLedgerSchema);
