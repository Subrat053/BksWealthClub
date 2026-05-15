import mongoose from "mongoose";

/**
 * AutoPool Level Counter Model
 * Tracks sequence numbers per user and level for rebirth naming
 *
 * Used to generate rebirth codes like:
 * BKS12345-0.1 (level 0, sequence 1)
 * BKS12345-1.5 (level 1, sequence 5)
 */
const autoPoolLevelCounterSchema = new mongoose.Schema(
  {
    // User who owns these rebirths
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Member ID for display
    ownerMemberId: {
      type: String,
      required: true,
      index: true,
    },

    // Rebirth level (0=initial, 1=first generation, etc.)
    levelNumber: {
      type: Number,
      required: true,
      index: true,
    },

    // Current sequence counter for this level
    currentSequence: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

// Compound index for atomic increment operations
autoPoolLevelCounterSchema.index(
  { ownerUserId: 1, levelNumber: 1 },
  { unique: true },
);

export const AutoPoolLevelCounter =
  mongoose.models.AutoPoolLevelCounter ||
  mongoose.model("AutoPoolLevelCounter", autoPoolLevelCounterSchema);
