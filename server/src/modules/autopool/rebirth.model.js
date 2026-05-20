import mongoose from "mongoose";

/**
 * Rebirth Model
 *
 * Represents rebirth IDs generated when an AutoPool node completes.
 * Main user gets 2 initial rebirths on deposit.
 * Completed nodes generate 2 new rebirths.
 */
const rebirthSchema = new mongoose.Schema(
  {
    // User who owns this rebirth ID
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Original deposit that triggered the initial rebirths
    depositId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deposit",
      default: null,
      index: true,
    },

    // Unique rebirth code (e.g., BKS1001-R1, BKS1001-R1-X1)
    rebirthCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    // Source Type: INITIAL or AUTOPool_COMPLETION
    sourceType: {
      type: String,
      enum: ["INITIAL", "AUTOPool_COMPLETION"],
      default: "INITIAL",
      index: true,
    },

    // Sequence number for ordering within generation
    sequenceNumber: {
      type: Number,
      default: 0,
    },

    // Generation level (0 = initial, 1 = first rebirth, 2 = second, etc.)
    generation: {
      type: Number,
      default: 0,
      index: true,
    },

    // Reference to parent rebirth ID (null for initial rebirths)
    parentRebirthId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RebirthId",
      default: null,
      index: true,
    },

    // Reference to the AutoPool node that generated this rebirth
    generatedFromNodeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AutoPoolNode",
      default: null,
      index: true,
    },

    // Legacy field for backward compatibility
    generatedFromPoolNodeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AutoPoolNode",
      default: null,
      index: true,
    },

    // Is this an initial rebirth created on deposit? (true for -R1, -R2)
    isInitialRebirth: {
      type: Boolean,
      default: false,
    },

    // Has this rebirth been placed in AutoPool?
    usedInAutoPool: {
      type: Boolean,
      default: false,
    },

    // Status of the rebirth
    status: {
      type: String,
      enum: ["ACTIVE", "PENDING", "PLACED", "COMPLETED"],
      default: "ACTIVE",
      index: true,
    },

    // NEW: Owner member ID for display
    ownerMemberId: {
      type: String,
      default: null,
      index: true,
    },

    // NEW: Rebirth level number (0 = initial, 1 = first generation, etc.)
    levelNumber: {
      type: Number,
      default: 0,
      index: true,
    },

    // NEW: Sequence number within this level
    levelSequence: {
      type: Number,
      default: 0,
    },

    // Canonical replay metadata
    mainUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    round: {
      type: Number,
      default: 0,
      index: true,
    },
    sequence: {
      type: Number,
      default: 0,
      index: true,
    },
    sourceParentRebirthId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RebirthId",
      default: null,
      index: true,
    },
    originalCreatedAt: {
      type: Date,
      default: null,
      index: true,
    },
    replayedAt: {
      type: Date,
      default: null,
      index: true,
    },
    repairVersion: {
      type: String,
      default: null,
      index: true,
    },
    seedBatchId: {
      type: String,
      default: null,
      index: true,
    },
    seedSource: {
      type: String,
      default: null,
      index: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
      index: true,
    },
    isDuplicate: {
      type: Boolean,
      default: false,
      index: true,
    },
    duplicateOfCode: {
      type: String,
      default: null,
      index: true,
    },

    // NEW: Display code in format: BKS12345-1.5
    displayCode: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

// Compound index for finding initial rebirths
rebirthSchema.index({ ownerUserId: 1, isInitialRebirth: 1 });

// Compound index for finding rebirths by generation
rebirthSchema.index({ ownerUserId: 1, generation: 1 });

// Compound index for finding rebirths by level and sequence
rebirthSchema.index({ ownerUserId: 1, levelNumber: 1, levelSequence: 1 });

// Index for display code lookup
rebirthSchema.index({ displayCode: 1 });

// Compound index for duplicate prevention
rebirthSchema.index(
  { depositId: 1, ownerUserId: 1, sequenceNumber: 1 },
  { sparse: true },
);
// NOTE: Removed stale { mainUserId, round, sequence } unique index — these fields
// are null in new-style RebirthId docs (schema now uses ownerUserId/levelNumber/levelSequence).
// The unique constraint on null values caused E11000 duplicate key errors for all seeded users.
// Duplicate prevention is now handled by the displayCode unique index and the nodeCode index
// on AutoPoolNode (ownerUserId + levelNumber + levelSequence compound unique index).

export const RebirthId =
  mongoose.models.RebirthId || mongoose.model("RebirthId", rebirthSchema);
