import mongoose from "mongoose";

const rebirthSchema = new mongoose.Schema(
  {
    ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    rebirthCode: { type: String, required: true, unique: true },
    sourceEntryId: { type: mongoose.Schema.Types.ObjectId, ref: "AutoPoolEntry", default: null },
    parentRebirthId: { type: mongoose.Schema.Types.ObjectId, ref: "RebirthId", default: null },
    generation: { type: Number, default: 1 },
    usedInAutoPool: { type: Boolean, default: false },
    autoPoolEntryId: { type: mongoose.Schema.Types.ObjectId, ref: "AutoPoolEntry", default: null, unique: true, sparse: true },
  },
  { timestamps: true }
);

export const RebirthId = mongoose.models.RebirthId || mongoose.model("RebirthId", rebirthSchema);
