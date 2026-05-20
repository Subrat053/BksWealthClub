import mongoose from "mongoose";

const autopoolRepairLockSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    isLocked: { type: Boolean, default: false, index: true },
    lockedBy: { type: String, default: null, index: true },
    startedAt: { type: Date, default: null, index: true },
    mode: { type: String, enum: ["dry-run", "apply"], default: null, index: true },
    repairVersion: { type: String, default: null, index: true },
    releasedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
);

autopoolRepairLockSchema.index({ key: 1, isLocked: 1, startedAt: 1 });

export const AutopoolRepairLock =
  mongoose.models.AutopoolRepairLock ||
  mongoose.model("AutopoolRepairLock", autopoolRepairLockSchema);