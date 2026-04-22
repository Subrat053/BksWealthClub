import mongoose from "mongoose";

const authSessionSchema = new mongoose.Schema(
  {
    userRef: { type: mongoose.Schema.Types.ObjectId, refPath: "userType" },
    userType: { type: String, enum: ["User", "Admin"], default: "User" },
    refreshTokenHash: { type: String, required: true },
    userAgent: { type: String, default: "" },
    ipAddress: { type: String, default: "" },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

export const AuthSessionModel = mongoose.models.AuthSession || mongoose.model("AuthSession", authSessionSchema);
