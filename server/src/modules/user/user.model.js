import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    memberId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    sponsorId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    sponsorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    referredByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      default: null,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    bepAddress: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },
    referralCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    referralLink: {
      type: String,
      required: true,
      trim: true,
    },
    registrationSource: {
      type: String,
      enum: ["website", "admin", "blank_node", "member_panel", "referral_link"],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "active", "inactive", "suspended", "blocked"],
      default: "pending",
      index: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    isActivated: {
      type: Boolean,
      default: false,
      index: true,
    },
    isSuspended: {
      type: Boolean,
      default: false,
      index: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    registeredAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true },
);

export const User = mongoose.model("User", userSchema);
