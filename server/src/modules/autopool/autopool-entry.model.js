import mongoose from "mongoose";

const autoPoolEntrySchema = new mongoose.Schema(
  {
    ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    displayId: { type: String, required: true, unique: true },
    sourceType: { type: String, enum: ["MAIN", "REBIRTH"], required: true },
    rebirthLevel: { type: Number, default: 0 },
    rebirthCount: { type: Number, default: 0 },
    sourceEntryId: { type: mongoose.Schema.Types.ObjectId, ref: "AutoPoolEntry", default: null },
    createdFromEntryId: { type: mongoose.Schema.Types.ObjectId, ref: "AutoPoolEntry", default: null },
    queueTimestamp: { type: Date, default: Date.now, index: true },
    status: { type: String, enum: ["PENDING", "PLACED", "COMPLETED"], default: "PENDING", index: true },
    matrixParentEntryId: { type: mongoose.Schema.Types.ObjectId, ref: "AutoPoolEntry", default: null, index: true },
    childrenEntryIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "AutoPoolEntry" }],
    directChildrenCount: { type: Number, default: 0, min: 0, max: 3 },
    depth: { type: Number, default: 0 },
    cycleNumber: { type: Number, default: 1 },
    completedAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// Index for FIFO placement
autoPoolEntrySchema.index({ status: 1, queueTimestamp: 1 });

// Ensure one MAIN entry per deposit per user
autoPoolEntrySchema.index({ ownerUserId: 1, "metadata.depositId": 1, sourceType: 1 }, { unique: true, partialFilterExpression: { sourceType: "MAIN" } });

// Ensure rebirths for a completion are unique
autoPoolEntrySchema.index({ createdFromEntryId: 1, displayId: 1 }, { unique: true, partialFilterExpression: { sourceType: "REBIRTH" } });

export const AutoPoolEntry = mongoose.models.AutoPoolEntry || mongoose.model("AutoPoolEntry", autoPoolEntrySchema);
