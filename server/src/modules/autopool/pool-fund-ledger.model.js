import mongoose from "mongoose";

/**
 * PoolFundLedger — ledger for all financial movements within the AutoPool system.
 * This tracks rebirth completions, level distributions, and reinvestments.
 */
const poolFundLedgerSchema = new mongoose.Schema(
  {
    mainUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sponsorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    // The rebirth ID that just completed (for REBIRTH_AUTOPOOL_COMPLETED type)
    completedRebirthId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AutoPoolNode",
      default: null,
      index: true,
    },
    // For NEW_REBIRTH_ALLOCATION, which rebirth was created
    relatedRebirthId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AutoPoolNode",
      default: null,
      index: true,
    },
    level: {
      type: Number,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "REBIRTH_AUTOPOOL_COMPLETED",
        "LEVEL_AUTOPOOL_COMPLETED",
        "USER_WITHDRAWAL_CREDIT",
        "REINVEST_TO_POOL_FUND",
        "NEW_REBIRTH_ALLOCATION",
        "SPONSOR_DEDUCTION",
        "COMPANY_FUND_DEDUCTION",
        "FINAL_REBIRTH_POOL_VALUE",
        "ALIAS_ACCOUNT_DEDUCTION",
      ],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    // Snapshot of formula values at time of distribution
    grossLevelIncome: { type: Number, default: 0 },
    withdrawalAmount: { type: Number, default: 0 },
    reinvestAmount: { type: Number, default: 0 },
    allocationPerNewRebirth: { type: Number, default: 0 },
    sponsorDeduction: { type: Number, default: 0 },
    companyDeduction: { type: Number, default: 0 },
    finalRebirthPoolValue: { type: Number, default: 0 },
    
    childrenCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["COMPLETED", "PENDING", "FAILED"],
      default: "COMPLETED",
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// Unique constraint only for individual rebirth completions to prevent double $60 payouts
poolFundLedgerSchema.index(
  { completedRebirthId: 1, type: 1 },
  { 
    unique: true, 
    partialFilterExpression: { type: "REBIRTH_AUTOPOOL_COMPLETED" } 
  }
);

// Unique constraint to prevent duplicate level payouts
poolFundLedgerSchema.index(
  { mainUserId: 1, level: 1, type: 1 },
  { 
    unique: true, 
    partialFilterExpression: { type: "LEVEL_AUTOPOOL_COMPLETED" } 
  }
);

export const PoolFundLedger =
  mongoose.models.PoolFundLedger ||
  mongoose.model("PoolFundLedger", poolFundLedgerSchema);
