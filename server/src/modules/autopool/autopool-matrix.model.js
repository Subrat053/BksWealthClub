import mongoose from "mongoose";

const autopoolMatrixSchema = new mongoose.Schema(
  {
    poolNodeId: { type: String, required: true, unique: true, index: true },
    linkedRebirthNodeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RebirthId",
      required: true,
      unique: true,
      index: true,
    },
    parentPoolNodeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AutopoolMatrix",
      default: null,
      index: true,
    },
    autopoolChildren: [
      { type: mongoose.Schema.Types.ObjectId, ref: "AutopoolMatrix" },
    ],
    autopoolChildrenCount: { type: Number, default: 0, min: 0, max: 3 },
    queuePosition: { type: Number, default: null, index: true },
    status: {
      type: String,
      enum: ["PENDING", "PLACED", "COMPLETED"],
      default: "PENDING",
      index: true,
    },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

autopoolMatrixSchema.index({ status: 1, autopoolChildrenCount: 1, createdAt: 1 });

autopoolMatrixSchema.index({ parentPoolNodeId: 1, createdAt: 1 });

export const AutopoolMatrix =
  mongoose.models.AutopoolMatrix ||
  mongoose.model("AutopoolMatrix", autopoolMatrixSchema);
