import mongoose from "mongoose";

const referralTreeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    sponsorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    referralLevel: { type: Number, default: 0, index: true },
    referralPath: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

referralTreeSchema.index({ sponsorUserId: 1, referralLevel: 1 });

export const ReferralTree =
  mongoose.models.ReferralTree ||
  mongoose.model("ReferralTree", referralTreeSchema);
