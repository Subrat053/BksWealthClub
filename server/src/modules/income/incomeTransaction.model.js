import mongoose from "mongoose";
import { INCOME_TYPES } from "./income.constants.js";

/**
 * IncomeTransaction — immutable audit trail for every credit
 * made during the $75 deposit income distribution.
 *
 * Each distribution creates multiple IncomeTransaction docs:
 * - 2 × RB_INCOME (rebirth wallets)
 * - 1 × SPONSOR_INCOME (or LEFTOVER_TO_COMPANY if no sponsor)
 * - 1 × COMPANY_FUND
 * - 1 × ACHIEVER_FUND
 * - 1 × ADMIN_FUND
 * - Up to 9 × LEVEL_INCOME (one per upline level)
 * - 0..N × LEFTOVER_TO_COMPANY (for missing uplines)
 */
const incomeTransactionSchema = new mongoose.Schema(
  {
    /** User/admin/superadmin who RECEIVES this credit */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    /** The user whose deposit triggered this distribution */
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /** The approved deposit that triggered this distribution */
    depositId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deposit",
      required: true,
      index: true,
    },

    /** Optional: which rebirth ID this credit relates to */
    rebirthId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rebirth",
      default: null,
    },

    /** Income category */
    type: {
      type: String,
      enum: Object.values(INCOME_TYPES),
      required: true,
      index: true,
    },

    /** For LEVEL_INCOME: which level (1–9) */
    level: {
      type: Number,
      default: null,
      min: 1,
      max: 9,
    },

    /** Dollar amount credited */
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    /** Always "CREDITED" — these records are never reversed */
    status: {
      type: String,
      default: "CREDITED",
      enum: ["CREDITED"],
    },

    /** Human-readable description */
    remarks: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

// Fast lookup: all transactions for a specific deposit
incomeTransactionSchema.index({ depositId: 1, type: 1 });

export const IncomeTransactionModel =
  mongoose.models.IncomeTransaction ||
  mongoose.model("IncomeTransaction", incomeTransactionSchema);
