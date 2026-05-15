import mongoose from "mongoose";

/**
 * CompanyFund — tracks the total accumulated company deductions from AutoPool.
 */
const companyFundSchema = new mongoose.Schema(
  {
    totalCompanyFund: {
      type: Number,
      default: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const CompanyFund =
  mongoose.models.CompanyFund ||
  mongoose.model("CompanyFund", companyFundSchema);

/**
 * CompanyFundEntry — detailed logs of every credit to the company fund.
 */
const companyFundEntrySchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      default: "AUTOPOOL_DEDUCTION",
    },
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    relatedLedgerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PoolFundLedger",
      index: true,
    },
    remarks: String,
  },
  { timestamps: true }
);

export const CompanyFundEntry =
  mongoose.models.CompanyFundEntry ||
  mongoose.model("CompanyFundEntry", companyFundEntrySchema);
