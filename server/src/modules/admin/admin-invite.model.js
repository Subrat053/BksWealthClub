import mongoose from "mongoose";

const adminUserInviteSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    sponsorId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    phone: {
      type: String,
      default: null,
      trim: true,
    },
    codeHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    isCodeVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

export const AdminUserInvite =
  mongoose.models.AdminUserInvite ||
  mongoose.model("AdminUserInvite", adminUserInviteSchema);
