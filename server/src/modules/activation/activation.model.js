import mongoose from "mongoose";

const activationSchema = new mongoose.Schema(
  {
    userRef: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["pending", "approved", "rejected", "activated"], default: "pending" },
    triggeredBy: { type: String, enum: ["wallet", "deposit", "admin"], default: "wallet" },
    note: { type: String, default: "" },
  },
  { timestamps: true },
);

export const ActivationModel = mongoose.models.Activation || mongoose.model("Activation", activationSchema);
