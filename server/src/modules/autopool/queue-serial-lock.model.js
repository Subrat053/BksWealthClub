import mongoose from "mongoose";

const queueSerialLockSchema = new mongoose.Schema(
  {
    lockKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    lockedBy: {
      type: String,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    heartbeat: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export const QueueSerialLock =
  mongoose.models.QueueSerialLock ||
  mongoose.model("QueueSerialLock", queueSerialLockSchema);
