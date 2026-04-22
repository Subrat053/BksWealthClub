import mongoose from "mongoose";

const walletSchema = new mongoose.Schema(
  {
    userRef: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    mainWallet: { type: Number, default: 0 },
    fundWallet: { type: Number, default: 0 },
    holdingWallet: { type: Number, default: 0 },
    lockedAmount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const WalletModel = mongoose.models.Wallet || mongoose.model("Wallet", walletSchema);
