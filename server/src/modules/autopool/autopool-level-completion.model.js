import mongoose from "mongoose";

/**
 * AutoPoolLevelCompletion Model
 * 
 * Tracks the completion of entire AutoPool levels for a user.
 * A level is completed only when ALL rebirth nodes of that level are completed.
 */
const autopoolLevelCompletionSchema = new mongoose.Schema(
  {
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    ownerMemberId: {
      type: String,
      required: true,
      index: true,
    },
    levelNumber: {
      type: Number,
      required: true,
      index: true,
    },
    autoPoolNumber: {
      type: Number,
      required: true,
    },
    expectedNodeCount: {
      type: Number,
      required: true,
    },
    completedNodeCount: {
      type: Number,
      default: 0,
    },
    isCompleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    }
  },
  { timestamps: true }
);

// Unique index: One completion record per user per level
autopoolLevelCompletionSchema.index({ ownerUserId: 1, levelNumber: 1 }, { unique: true });

export const AutoPoolLevelCompletion = 
  mongoose.models.AutoPoolLevelCompletion || 
  mongoose.model("AutoPoolLevelCompletion", autopoolLevelCompletionSchema);
