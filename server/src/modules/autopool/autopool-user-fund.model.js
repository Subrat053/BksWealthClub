import mongoose from "mongoose";

const autopoolUserFundSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    completedAutopoolLevel: {
      type: Number,
      default: 0,
    },
    poolFundTotal: {
      type: Number,
      default: 0,
    },
    reinvestmentFundTotal: {
      type: Number,
      default: 0,
    },
    withdrawableAutopoolFund: {
      type: Number,
      default: 0,
    },
    upgradeIdCount: {
      type: Number,
      default: 0,
    },
    upgradeDeductionTotal: {
      type: Number,
      default: 0,
    },
    lastCompletedRound: {
      type: Number,
      default: -1,
    },
  },
  { timestamps: true }
);

export const AutopoolUserFund =
  mongoose.models.AutopoolUserFund ||
  mongoose.model("AutopoolUserFund", autopoolUserFundSchema);
