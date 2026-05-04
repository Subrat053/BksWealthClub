import mongoose from "mongoose";
import { AutopoolNodeModel } from "./autopool.model.js";

export const autopoolRepository = {
  // ─── Node Creation ──────────────────────────────────────────────────────────

  createNode: async (payload) => AutopoolNodeModel.create(payload),

  createManyNodes: async (payloads) => AutopoolNodeModel.insertMany(payloads),

  // ─── BFS Queue ──────────────────────────────────────────────────────────────

  /**
   * Find the next available parent slot using BFS ordering:
   * - status = "active" or "regenerated"
   * - childrenCount < 3
   * - oldest joinedAt first (millisecond precision)
   */
  findNextAvailableParent: async () => {
    return AutopoolNodeModel.findOne({
      status: { $in: ["active", "regenerated"] },
      childrenCount: { $lt: 3 },
    })
      .sort({ childrenCount: 1, joinedAt: 1 }) // prefer less-filled nodes first, then oldest
      .lean();
  },

  // ─── Node Reads ─────────────────────────────────────────────────────────────

  findById: async (id) => AutopoolNodeModel.findById(id).lean(),

  findByNodeId: async (nodeId) => AutopoolNodeModel.findOne({ nodeId }).lean(),

  findByUserRef: async (userRef) =>
    AutopoolNodeModel.find({ userRef }).sort({ joinedAt: 1 }).lean(),

  findChildrenOf: async (parentNodeRef) =>
    AutopoolNodeModel.find({ parentNodeRef })
      .sort({ positionUnderParent: 1 })
      .lean(),

  // ─── Node Updates ───────────────────────────────────────────────────────────

  /**
   * Atomically increment childrenCount on a parent node.
   * Returns the updated doc. If childrenCount reaches 3, mark completed.
   */
  incrementChildrenCount: async (parentNodeId) => {
    const updated = await AutopoolNodeModel.findByIdAndUpdate(
      parentNodeId,
      { $inc: { childrenCount: 1 } },
      { new: true },
    );

    // If now full → mark completed
    if (updated && updated.childrenCount >= 3) {
      updated.status = "completed";
      updated.completedAt = new Date();
      await updated.save();
    }

    return updated;
  },

  updateStatus: async (nodeId, status) =>
    AutopoolNodeModel.findByIdAndUpdate(nodeId, { status }, { new: true }),

  // ─── Tree / Community View ───────────────────────────────────────────────────

  /**
   * Fetch the full community tree (all nodes) for display.
   * Populated with user info.
   */
  findAllNodes: async () =>
    AutopoolNodeModel.find({})
      .populate("userRef", "memberId fullName")
      .populate("parentNodeRef", "nodeId")
      .sort({ joinedAt: 1 })
      .lean(),

  /**
   * Fetch a subtree rooted at a given node (for member's own view).
   * Simple version: returns the node + its descendants via $graphLookup.
   */
  findSubtreeByNodeId: async (rootNodeId) => {
    return AutopoolNodeModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(rootNodeId) } },
      {
        $graphLookup: {
          from: "autopoolnodes",
          startWith: "$_id",
          connectFromField: "_id",
          connectToField: "parentNodeRef",
          as: "descendants",
          maxDepth: 10,
        },
      },
    ]);
  },

  // ─── Stats ──────────────────────────────────────────────────────────────────

  countByStatus: async (status) => AutopoolNodeModel.countDocuments({ status }),

  findCompletedPendingRebirth: async () =>
    AutopoolNodeModel.find({ status: "completed" }).lean(),
};
