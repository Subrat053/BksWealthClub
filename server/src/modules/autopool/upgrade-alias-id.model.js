import mongoose from "mongoose";

const upgradeAliasIdSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    aliasMemberId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    aliasId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    aliasUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    originalMainUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sponsorId: {
      type: String,
      required: true,
      index: true,
    },
    createdFromAutopoolLevel: {
      type: Number,
      required: true,
      index: true,
    },
    aliasSequence: {
      type: Number,
      default: 1,
      index: true,
    },
    deductionAmount: {
      type: Number,
      default: 75,
    },
    autoDepositId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deposit",
      default: null,
      index: true,
    },
    aliasRebirthIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "RebirthId",
      default: [],
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "INVALID", "DUPLICATE", "REPAIRED"],
      default: "ACTIVE",
    },
  },
  { timestamps: true }
);

export const UpgradeAliasId =
  mongoose.models.UpgradeAliasId ||
  mongoose.model("UpgradeAliasId", upgradeAliasIdSchema);
