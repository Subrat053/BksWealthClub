import mongoose from "mongoose";

const autopoolFundTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sourceRebirthId: {
      type: String,
      required: true,
    },
    completedLevel: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: [
        "POOL_FUND_CREDIT",
        "REINVESTMENT_FUND_CREDIT",
        "WITHDRAWABLE_AUTOPOOL_CREDIT",
        "UPGRADE_ID_DEDUCTION",
      ],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Index for query optimization
autopoolFundTransactionSchema.index({ userId: 1, createdAt: -1 });
autopoolFundTransactionSchema.index({ userId: 1, completedLevel: 1 });

export const AutopoolFundTransaction =
  mongoose.models.AutopoolFundTransaction ||
  mongoose.model("AutopoolFundTransaction", autopoolFundTransactionSchema);
