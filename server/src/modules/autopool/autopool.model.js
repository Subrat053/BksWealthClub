import mongoose from "mongoose";

/**
 * AutopoolNode — represents a single "slot" in the global BFS matrix.
 *
 * When a member activates ($75), TWO nodes are created:
 *   slotIndex 1 → status: "active"
 *   slotIndex 2 → status: "on_hold"
 *
 * The on-hold node becomes active only when needed for rebirth fills.
 *
 * Matrix: 1×3  (one parent, max 3 children)
 * Placement: strict BFS order using joinedAt (millisecond precision)
 */
const autopoolNodeSchema = new mongoose.Schema(
  {
    // Which real user owns this node
    userRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Dual-ID label: e.g. "BWC0001.1" or "BWC0001.2"
    nodeId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    // 1 = active slot, 2 = on-hold slot
    slotIndex: {
      type: Number,
      enum: [1, 2],
      required: true,
    },

    // Parent node in the BFS tree (null = root / top of pool)
    parentNodeRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AutopoolNode",
      default: null,
      index: true,
    },

    // Position under parent: 1, 2, or 3
    positionUnderParent: {
      type: Number,
      enum: [1, 2, 3],
      default: null,
    },

    // How deep in the global tree (0 = root)
    level: {
      type: Number,
      default: 0,
    },

    // How many direct children this node currently has (max 3)
    childrenCount: {
      type: Number,
      default: 0,
      min: 0,
      max: 3,
    },

    // Node lifecycle status
    status: {
      type: String,
      enum: [
        "active", // placed in pool, accepting children
        "on_hold", // created but not yet placed (slot 2)
        "completed", // received 3 children → triggered rebirth
        "regenerated", // re-entered pool after rebirth cycle
      ],
      default: "active",
      index: true,
    },

    // Which autopool cycle this belongs to (increments on rebirth)
    cycleNumber: {
      type: Number,
      default: 1,
    },

    // If this node was created via rebirth, reference the node that triggered it
    rebirthFromNodeRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AutopoolNode",
      default: null,
    },

    // Millisecond-precision join time for BFS ordering
    joinedAt: {
      type: Date,
      default: () => new Date(),
      index: true,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// Compound index for fast BFS queue lookup:
// Find oldest active node with fewest children
autopoolNodeSchema.index({ status: 1, childrenCount: 1, joinedAt: 1 });

export const AutopoolNodeModel =
  mongoose.models.AutopoolNode ||
  mongoose.model("AutopoolNode", autopoolNodeSchema);
