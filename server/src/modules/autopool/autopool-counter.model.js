import mongoose from "mongoose";

const autoPoolCounterSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    seq: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const AutoPoolCounter =
  mongoose.models.AutoPoolCounter ||
  mongoose.model("AutoPoolCounter", autoPoolCounterSchema);
