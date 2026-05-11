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
    
    /** Processing state for atomic tracking */
    processingStatus: { type: String, enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED"], default: "PENDING" },
    activationProcessed: { type: Boolean, default: false },
    rebirthProcessed: { type: Boolean, default: false },
    autoPoolProcessed: { type: Boolean, default: false },

    /** Whether the $75 income distribution has been executed for this deposit */
    incomeDistributed: { type: Boolean, default: false, index: true },
    /** When the income distribution was completed */
    distributedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const DepositModel = mongoose.models.Deposit || mongoose.model("Deposit", depositSchema);
