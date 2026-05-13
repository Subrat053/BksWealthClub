import mongoose from "mongoose";

const autoPoolQueueSchema = new mongoose.Schema(
  {
    rebirthNodeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RebirthId",
      required: true,
      unique: true,
      index: true,
    },
    queuePosition: { type: Number, required: true, index: true },
    processed: { type: Boolean, default: false, index: true },
    processedAt: { type: Date, default: null },
    processingLockId: { type: String, default: null, index: true },
    processingStartedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

autoPoolQueueSchema.index({ processed: 1, queuePosition: 1 });

export const AutoPoolQueue =
  mongoose.models.AutoPoolQueue ||
  mongoose.model("AutoPoolQueue", autoPoolQueueSchema);
