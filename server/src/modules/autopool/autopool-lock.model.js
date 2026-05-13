import mongoose from "mongoose";

const autoPoolLockSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    lockedUntil: { type: Date, default: null, index: true },
    lockedBy: { type: String, default: null, index: true },
    lockedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

autoPoolLockSchema.index({ key: 1, lockedUntil: 1 });

export const AutoPoolLock =
  mongoose.models.AutoPoolLock ||
  mongoose.model("AutoPoolLock", autoPoolLockSchema);
