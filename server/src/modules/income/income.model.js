import mongoose from "mongoose";

const incomeLedgerSchema = new mongoose.Schema(
  {
    userRef: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    incomeType: { type: String, enum: ["sponsor", "representative", "autopool", "other"], required: true },
    amount: { type: Number, required: true },
    entryType: { type: String, enum: ["credit", "debit"], default: "credit" },
    remarks: { type: String, default: "" },
    referenceId: { type: String, default: "" },
    occurredAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const IncomeLedgerModel =
  mongoose.models.IncomeLedger || mongoose.model("IncomeLedger", incomeLedgerSchema);
