import mongoose from "mongoose";

const autopoolQueueCounterSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    currentSerialNo: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const AutopoolQueueCounter =
  mongoose.models.AutopoolQueueCounter ||
  mongoose.model("AutopoolQueueCounter", autopoolQueueCounterSchema);
