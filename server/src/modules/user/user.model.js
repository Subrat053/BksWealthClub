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
    country: {
      type: String,
      default: null,
      trim: true,
    },
    countryCode: {
      type: String,
      default: null,
      trim: true,
    },
    dialCode: {
      type: String,
      default: null,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    plainPassword: {
      type: String,
      default: null,
      select: false, // hidden from normal queries, exposed only via admin
    },
    emailVerificationToken: {
      type: String,
      default: null,
      select: false,
    },
    emailVerificationExpiry: {
      type: Date,
      default: null,
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
    activationStatus: {
      type: String,
      enum: ["PENDING_EMAIL", "PENDING_DEPOSIT", "ACTIVE"],
      default: "PENDING_EMAIL",
      index: true,
    },
    activatedAt: {
      type: Date,
      default: null,
    },
    activatedByDepositId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deposit",
      default: null,
    },
    isOperationalAdmin: {
      type: Boolean,
      default: false,
      index: true,
    },
    isSystemRoot: {
      type: Boolean,
      default: false,
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
    twoFactorEnabled: {
      type: Boolean,
      default: false,
      index: true,
    },
    twoFactorSecret: {
      type: String,
      default: null,
      select: false,
    },
    twoFactorPendingSecret: {
      type: String,
      default: null,
      select: false,
    },
    twoFactorVerifiedAt: {
      type: Date,
      default: null,
    },
    registeredAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    // Alias Account Tracking
    isAliasAccount: {
      type: Boolean,
      default: false,
      index: true,
    },
    aliasOfUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    aliasOfAccountId: {
      type: String,
      default: null,
      index: true,
    },
    rootOwnerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    rootOwnerAccountId: {
      type: String,
      default: null,
      index: true,
    },
    createdFromAutopoolLevel: {
      type: Number,
      default: null,
    },
    createdFromCompletionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AutoPoolLevelCompletion",
      default: null,
    },
    source: {
      type: String,
      default: null,
    },
    autoCreatedDepositAmount: {
      type: Number,
      default: 0,
    },
    lifecycleStoppedAfterRound9: {
      type: Boolean,
      default: false,
      index: true,
    },
    currentCompletedAutopoolRound: {
      type: Number,
      default: -1,
      index: true,
    },
    processedAutopoolRounds: {
      type: [Number],
      default: [],
    },
  },
  { timestamps: true },
);

export const User = mongoose.model("User", userSchema);
export const UserModel = User;
