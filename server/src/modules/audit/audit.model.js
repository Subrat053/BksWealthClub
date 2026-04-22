import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    actorRef: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    actorRole: { type: String, default: "admin" },
    action: { type: String, required: true },
    module: { type: String, required: true },
    targetRef: { type: mongoose.Schema.Types.ObjectId },
    payloadSnapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
    ipAddress: { type: String, default: "" },
    userAgent: { type: String, default: "" },
  },
  { timestamps: true },
);

export const AuditLogModel = mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);
