import mongoose from "mongoose";

const autoPoolQueueSchema = new mongoose.Schema(
  {
    nodeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AutoPoolEntry",
      required: true,
      unique: true,
      index: true,
    },
    queueTimestamp: { type: Date, default: Date.now, index: true },
    queuePosition: { type: Number, required: true, index: true },
    status: {
      type: String,
      enum: ["WAITING", "PROCESSING", "PLACED"],
      default: "WAITING",
      index: true,
    },
    processingLockId: { type: String, default: null },
    processingStartedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

autoPoolQueueSchema.index({ status: 1, queuePosition: 1 });

autoPoolQueueSchema.index(
  { status: 1, queueTimestamp: 1, queuePosition: 1 },
  { name: "fifo_queue" },
);

export const AutoPoolQueue =
  mongoose.models.AutoPoolQueue ||
  mongoose.model("AutoPoolQueue", autoPoolQueueSchema);
