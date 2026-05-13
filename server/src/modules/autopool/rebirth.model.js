import mongoose from "mongoose";

const rebirthSchema = new mongoose.Schema(
  {
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    rebirthCode: { type: String, required: true, unique: true, index: true },
    parentRebirthId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RebirthId",
      default: null,
      index: true,
    },
    rebirthChildren: [
      { type: mongoose.Schema.Types.ObjectId, ref: "RebirthId" },
    ],
    rebirthChildrenCount: { type: Number, default: 0, min: 0, max: 2 },
    generation: { type: Number, default: 0, index: true },
    status: {
      type: String,
      enum: ["ACTIVE", "COMPLETED"],
      default: "ACTIVE",
      index: true,
    },
    linkedPoolNodeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AutopoolMatrix",
      default: null,
      index: true,
    },
  },
  { timestamps: true },
);

rebirthSchema.index({ ownerUserId: 1, generation: 1 });

export const RebirthId =
  mongoose.models.RebirthId || mongoose.model("RebirthId", rebirthSchema);
