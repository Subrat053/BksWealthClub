import mongoose from "mongoose";

const walletSummarySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    
    // Core balance sources (withdrawable)
    autopoolWithdrawableBalance: { type: Number, default: 0 },
    sponsorIncomeBalance: { type: Number, default: 0 },
    levelIncomeBalance: { type: Number, default: 0 },
    
    // Transfer balances
    walletTransferReceivedBalance: { type: Number, default: 0 },
    walletTransferSentBalance: { type: Number, default: 0 },
    
    // Withdrawal locks
    lockedWithdrawalBalance: { type: Number, default: 0 },
    
    // Saved/cached balance values
    totalWithdrawableBalance: { type: Number, default: 0 },
    availableBalance: { type: Number, default: 0 },
    
    // Auditable lifetimers
    lifetimeWithdrawn: { type: Number, default: 0 },
    lifetimeAdminCharges: { type: Number, default: 0 },
    lifetimeTransferredOut: { type: Number, default: 0 },
    lifetimeTransferredIn: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const WalletSummaryModel = mongoose.models.WalletSummary || mongoose.model("WalletSummary", walletSummarySchema);
