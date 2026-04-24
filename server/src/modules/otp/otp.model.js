import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  verified: { type: Boolean, default: false },
  // Temporarily hold registration payload until OTP verified
  payload: { type: mongoose.Schema.Types.Mixed },
});

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // auto-delete expired

export const OtpModel = mongoose.model("Otp", otpSchema);
