import mongoose from "mongoose";

const referralRelationSchema = new mongoose.Schema(
  {
    sponsorUserRef: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    referredUserRef: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    level: { type: Number, default: 1 },
    relationPath: { type: [mongoose.Schema.Types.ObjectId], default: [] },
  },
  { timestamps: true },
);

export const ReferralRelationModel =
  mongoose.models.ReferralRelation || mongoose.model("ReferralRelation", referralRelationSchema);
