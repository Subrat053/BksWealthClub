import mongoose from "mongoose";

const autoPoolEntrySchema = new mongoose.Schema(
  {
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sourceUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    displayId: { type: String, required: true, unique: true },
    rebirthCode: { type: String, default: null, index: true },
    sourceType: { type: String, enum: ["MAIN", "REBIRTH"], required: true },
    rebirthLevel: { type: Number, default: 0 },
    rebirthCount: { type: Number, default: 0 },
    rebirthIndex: { type: Number, default: null },
    sourceEntryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AutoPoolEntry",
      default: null,
    },
    createdFromEntryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AutoPoolEntry",
      default: null,
    },
    queueTimestamp: { type: Date, default: Date.now, index: true },
    queuePosition: { type: Number, default: null, index: true },
    status: {
      type: String,
      enum: ["PENDING", "PLACED", "COMPLETED"],
      default: "PENDING",
      index: true,
    },
    matrixParentEntryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AutoPoolEntry",
      default: null,
      index: true,
    },
    childrenEntryIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: "AutoPoolEntry" },
    ],
    directChildrenCount: { type: Number, default: 0, min: 0, max: 3 },
    depth: { type: Number, default: 0 },
    cycleNumber: { type: Number, default: 1 },
    placedAt: { type: Date, default: null, index: true },
    completedAt: { type: Date, default: null },
    completionProcessed: { type: Boolean, default: false, index: true },
    rebirthGenerated: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

// Index for FIFO placement
autoPoolEntrySchema.index({ status: 1, queueTimestamp: 1 });
autoPoolEntrySchema.index({ status: 1, directChildrenCount: 1, placedAt: 1 });

// Ensure one MAIN entry per deposit per user
autoPoolEntrySchema.index(
  { ownerUserId: 1, "metadata.depositId": 1, sourceType: 1 },
  { unique: true, partialFilterExpression: { sourceType: "MAIN" } },
);

// Ensure rebirths for a completion are unique
autoPoolEntrySchema.index(
  { createdFromEntryId: 1, rebirthIndex: 1 },
  {
    unique: true,
    partialFilterExpression: {
      sourceType: "REBIRTH",
      createdFromEntryId: { $ne: null },
      rebirthIndex: { $ne: null },
    },
  },
);

// Ensure initial rebirths per deposit are unique
autoPoolEntrySchema.index(
  { ownerUserId: 1, "metadata.depositId": 1, rebirthIndex: 1, sourceType: 1 },
  {
    unique: true,
    partialFilterExpression: {
      sourceType: "REBIRTH",
      "metadata.depositId": { $exists: true },
      rebirthIndex: { $ne: null },
    },
  },
);

export const AutoPoolEntry =
  mongoose.models.AutoPoolEntry ||
  mongoose.model("AutoPoolEntry", autoPoolEntrySchema);
