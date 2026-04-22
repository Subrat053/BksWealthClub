import mongoose from "mongoose";

const autopoolNodeSchema = new mongoose.Schema(
  {
    userRef: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    cycleRef: { type: mongoose.Schema.Types.ObjectId, ref: "AutopoolCycle", index: true },
    parentNodeRef: { type: mongoose.Schema.Types.ObjectId, ref: "AutopoolNode" },
    level: { type: Number, default: 0 },
    position: { type: Number, default: 0 },
    slotStatus: { type: String, enum: ["occupied", "vacant"], default: "occupied" },
  },
  { timestamps: true },
);

const autopoolCycleSchema = new mongoose.Schema(
  {
    userRef: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    cycleNumber: { type: Number, default: 1 },
    rebirthCount: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "completed"], default: "active" },
  },
  { timestamps: true },
);

export const AutopoolNodeModel = mongoose.models.AutopoolNode || mongoose.model("AutopoolNode", autopoolNodeSchema);
export const AutopoolCycleModel =
  mongoose.models.AutopoolCycle || mongoose.model("AutopoolCycle", autopoolCycleSchema);
