import mongoose from "mongoose";

/**
 * UserRoundProgress Model
 * 
 * Tracks the progression and completion of entire AutoPool rounds/levels for a user.
 * A level is completed when the number of completed rebirths equals totalRequired (2 ^ (round + 1)).
 */
const userRoundProgressSchema = new mongoose.Schema(
  {
    // Original main owner user who completes the round
    mainUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Round number (0 to 9)
    round: {
      type: Number,
      required: true,
      index: true,
    },

    // Total completed rebirths required for this round: 2 ^ (round + 1)
    totalRequired: {
      type: Number,
      required: true,
    },

    // Number of rebirths currently generated for this round (should match totalRequired when fully seeded)
    totalGenerated: {
      type: Number,
      default: 0,
    },

    // Number of completed rebirths in this round
    completedCount: {
      type: Number,
      default: 0,
    },

    // Is the round completed?
    isCompleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    // When was the round completed?
    completedAt: {
      type: Date,
      default: null,
    },

    // Flag indicating whether isolated fund credit payouts has been successfully applied
    fundEventApplied: {
      type: Boolean,
      default: false,
    },

    // Flag indicating whether system-generated alias accounts has been successfully created
    aliasEventApplied: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Unique compound index: One round progress tracking record per user per round
userRoundProgressSchema.index({ mainUserId: 1, round: 1 }, { unique: true });

export const UserRoundProgress =
  mongoose.models.UserRoundProgress ||
  mongoose.model("UserRoundProgress", userRoundProgressSchema);
