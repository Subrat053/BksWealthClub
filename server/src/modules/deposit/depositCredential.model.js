import mongoose from "mongoose";

const depositCredentialSchema = new mongoose.Schema(
  {
    network: {
      type: String,
      required: [true, "Wallet network is required"],
      trim: true,
    },
    walletAddress: {
      type: String,
      required: [true, "Wallet address is required"],
      trim: true,
    },
    qrCodeUrl: {
      type: String,
      required: [true, "QR code URL is required"],
      trim: true,
    },
    instructions: {
      type: String,
      default: "",
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const DepositCredentialModel =
  mongoose.models.DepositCredential ||
  mongoose.model("DepositCredential", depositCredentialSchema);
