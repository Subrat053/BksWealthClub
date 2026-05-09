import mongoose from "mongoose";

const autoPoolLogSchema = new mongoose.Schema(
  {
    actionType: { type: String, required: true },
    entryId: { type: mongoose.Schema.Types.ObjectId, ref: "AutoPoolEntry" },
    ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    message: { type: String },
    beforeData: { type: mongoose.Schema.Types.Mixed },
    afterData: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const AutoPoolLog = mongoose.models.AutoPoolLog || mongoose.model("AutoPoolLog", autoPoolLogSchema);
