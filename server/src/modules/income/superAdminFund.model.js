import mongoose from "mongoose";

/**
 * SuperAdminFund — singleton document that tracks cumulative
 * funds collected from all deposit distributions.
 *
 * Use the helper `getOrCreateFund()` to ensure exactly one
 * document exists, then use `$inc` for all updates.
 */
const superAdminFundSchema = new mongoose.Schema(
  {
    /** Company fund: $2.5 × 2 RB = $5 per deposit */
    companyFund: {
      type: Number,
      default: 0,
      min: 0,
    },

    /** Achiever fund: $2 × 2 RB = $4 per deposit */
    achieverFund: {
      type: Number,
      default: 0,
      min: 0,
    },

    /** Admin fund: $2.5 × 2 RB = $5 per deposit */
    adminFund: {
      type: Number,
      default: 0,
      min: 0,
    },

    /** Leftover fund: unclaimed sponsor/level income from missing uplines */
    leftoverFund: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true },
);

export const SuperAdminFundModel =
  mongoose.models.SuperAdminFund ||
  mongoose.model("SuperAdminFund", superAdminFundSchema);

/**
 * Returns the singleton SuperAdminFund document, creating it if needed.
 * Safe to call concurrently — uses upsert.
 */
export async function getOrCreateFund(session = null) {
  const opts = session ? { session } : {};
  let fund = await SuperAdminFundModel.findOne({}, null, opts);
  if (!fund) {
    [fund] = await SuperAdminFundModel.create([{}], opts);
  }
  return fund;
}
