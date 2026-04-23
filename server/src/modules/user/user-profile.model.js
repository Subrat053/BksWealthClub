import mongoose from "mongoose";

const userProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    fatherName: {
      type: String,
      default: null,
      trim: true,
    },
    dob: {
      type: Date,
      default: null,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other", null],
      default: null,
    },
    addressLine1: {
      type: String,
      default: null,
      trim: true,
    },
    addressLine2: {
      type: String,
      default: null,
      trim: true,
    },
    city: {
      type: String,
      default: null,
      trim: true,
    },
    state: {
      type: String,
      default: null,
      trim: true,
    },
    postalCode: {
      type: String,
      default: null,
      trim: true,
    },
    country: {
      type: String,
      default: null,
      trim: true,
    },
    crypto: {
      bep20WalletAddress: {
        type: String,
        default: null,
        trim: true,
      },
      trc20WalletAddress: {
        type: String,
        default: null,
        trim: true,
      },
      preferredNetwork: {
        type: String,
        enum: ["BEP20", "TRC20", "ERC20", null],
        default: null,
      },
    },
  },
  { timestamps: true },
);

export const UserProfile = mongoose.model("UserProfile", userProfileSchema);
