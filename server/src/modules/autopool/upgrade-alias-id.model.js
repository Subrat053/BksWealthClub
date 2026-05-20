import mongoose from "mongoose";

const upgradeAliasIdSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    aliasId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    sourceAutopoolLevel: {
      type: Number,
      required: true,
    },
    deductionAmount: {
      type: Number,
      default: 75,
    },
    status: {
      type: String,
      default: "ACTIVE",
    },
  },
  { timestamps: true }
);

export const UpgradeAliasId =
  mongoose.models.UpgradeAliasId ||
  mongoose.model("UpgradeAliasId", upgradeAliasIdSchema);
