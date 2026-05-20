import mongoose from "mongoose";

/**
 * AutoPoolNode Model
 * 
 * Represents a node in the 3x3 Matrix AutoPool.
 * Each node can be a MAIN user node or a REBIRTH node.
 * A node completes when it has exactly 3 direct children.
 */
const autopoolNodeSchema = new mongoose.Schema(
  {
    // User who owns this node
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Unique node code (e.g., BKS1001, BKS1001-R1)
    nodeCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    // Node ID (can be same as nodeCode)
    nodeId: {
      type: String,
      index: true,
    },

    // Type: "ROOT" for system root, "MAIN" for main user node, "REBIRTH" for rebirth nodes
    nodeType: {
      type: String,
      enum: ["ROOT", "MAIN", "REBIRTH"],
      required: true,
      index: true,
    },

    // Reference to the user (for MAIN nodes)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    // Reference to the rebirth ID (for REBIRTH nodes)
    rebirthId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RebirthId",
      default: null,
      index: true,
      sparse: true,
    },

    // Rebirth code (for display/reference)
    rebirthCode: {
      type: String,
      index: true,
    },

    // User member ID (denormalized for faster querying/rendering)
    ownerMemberId: {
      type: String,
      index: true,
    },

    // Display code for the tree (alias for nodeCode)
    displayCode: {
      type: String,
      index: true,
    },

    // Level number (0, 1, 2...)
    levelNumber: {
      type: Number,
      default: 0,
      index: true,
    },

    // Sequence within the level (1, 2, 3...)
    levelSequence: {
      type: Number,
      default: 0,
    },

    // Canonical replay identifiers
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
    childSlot: {
      type: Number,
      default: null,
      index: true,
    },
    queueOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    placementOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    placedAt: {
      type: Date,
      default: null,
      index: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
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

    // Stable queue ordering tie-breaker for seeded or same-timestamp nodes
    queueIndex: {
      type: Number,
      default: 0,
      index: true,
    },

    // Flag for main user nodes (though new rules say they don't enter AutoPool)
    isMainUserNode: {
      type: Boolean,
      default: false,
    },

    // Reference to the AutoPool node that generated this node (for rebirth nodes)
    generatedFromNodeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AutoPoolNode",
      default: null,
      index: true,
    },

    // Deposit that initiated this node
    depositId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deposit",
      default: null,
      index: true,
    },

    // Timestamp when this node entered the queue
    queueTimestamp: {
      type: Date,
      default: () => new Date(),
      index: true,
    },

    // Node status: PENDING (waiting to be placed), PLACED (has a position), COMPLETED (has 3 children)
    status: {
      type: String,
      enum: ["PENDING", "PLACED", "COMPLETED"],
      default: "PENDING",
      index: true,
    },

    // Reference to the parent node in the matrix
    matrixParentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AutoPoolNode",
      default: null,
      index: true,
    },

    // Alias for matrixParentId for the new system
    parentNodeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AutoPoolNode",
      default: null,
    },

    // Direct children in this node
    directChildren: [
      { type: mongoose.Schema.Types.ObjectId, ref: "AutoPoolNode" },
    ],

    // Count of direct children (0-3)
    directChildrenCount: {
      type: Number,
      default: 0,
      min: 0,
      max: 3,
    },

    // Have rebirth IDs been generated for this completed node?
    rebirthGenerated: {
      type: Boolean,
      default: false,
    },

    // When were the rebirth IDs generated?
    rebirthGeneratedAt: {
      type: Date,
      default: null,
    },

    // When was this node completed?
    completedAt: {
      type: Date,
      default: null,
    },

    // Root flags
    isRoot: {
      type: Boolean,
      default: false,
    },
    isOperationalRoot: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// Index for finding pending nodes by queue timestamp
autopoolNodeSchema.index({ status: 1, queueTimestamp: 1 });
autopoolNodeSchema.index({ status: 1, queueIndex: 1, createdAt: 1, _id: 1 });

// Index for finding placed nodes available for children
autopoolNodeSchema.index({ status: 1, directChildrenCount: 1, queueTimestamp: 1 });

// Index for finding nodes by owner
autopoolNodeSchema.index({ ownerUserId: 1, nodeType: 1 });

// Compound index for duplicate prevention of rebirths within a level
autopoolNodeSchema.index({ ownerUserId: 1, levelNumber: 1, levelSequence: 1 }, { unique: true, sparse: true });
autopoolNodeSchema.index({ mainUserId: 1, round: 1, sequence: 1 }, { unique: true, sparse: true });

export const AutoPoolNode =
  mongoose.models.AutoPoolNode ||
  mongoose.model("AutoPoolNode", autopoolNodeSchema);

// Keep the old export name for backward compatibility
export const AutopoolMatrix = AutoPoolNode;
