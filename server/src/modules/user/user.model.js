import mongoose from "mongoose";
import { ACCOUNT_STATUS, ACTIVATION_STATUS, USER_ROLES } from "../../common/enums/index.js";

const walletAddressSchema = new mongoose.Schema(
  {
    network: { type: String, trim: true },
    address: { type: String, trim: true },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: false },
);

const securitySchema = new mongoose.Schema(
  {
    twoFactorEnabled: { type: Boolean, default: false },
    kycStatus: { type: String, default: "pending" },
    loginBlocked: { type: Boolean, default: false },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true, uppercase: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    country: { type: String, trim: true },
    mobile: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    sponsorId: { type: String, trim: true, uppercase: true },
    sponsorUserRef: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    referralCode: { type: String, unique: true, uppercase: true, trim: true },
    referralLinkCode: { type: String, trim: true },
    role: { type: String, enum: Object.values(USER_ROLES), default: USER_ROLES.USER },
    accountStatus: { type: String, enum: Object.values(ACCOUNT_STATUS), default: ACCOUNT_STATUS.INACTIVE },
    activationStatus: { type: String, enum: Object.values(ACTIVATION_STATUS), default: ACTIVATION_STATUS.PENDING },
    joinDate: { type: Date, default: Date.now },
    activationDate: { type: Date },
    avatar: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    walletAddresses: { type: [walletAddressSchema], default: [] },
    securityFlags: { type: securitySchema, default: () => ({}) },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const UserModel = mongoose.models.User || mongoose.model("User", userSchema);
