import mongoose from "mongoose";

/**
 * Rebirth — represents one of the 2 replica/rebirth IDs created
 * when a user's $75 deposit is successfully approved.
 *
 * Each rebirth has its own walletBalance that receives $20 from the deposit.
 */
const rebirthSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /** Unique human-readable code, e.g. "BWC12345-RB1" */
    rebirthCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    /** 1 or 2 — first or second rebirth for this deposit */
    sequenceNo: {
      type: Number,
      required: true,
      enum: [1, 2],
    },

    /** Wallet balance credited from the deposit distribution */
    walletBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    /** The deposit that created this rebirth */
    sourceDepositId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deposit",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

// Compound index: one user can have at most 2 rebirths per deposit
rebirthSchema.index(
  { userId: 1, sourceDepositId: 1, sequenceNo: 1 },
  { unique: true },
);

export const RebirthModel =
  mongoose.models.Rebirth || mongoose.model("Rebirth", rebirthSchema);
