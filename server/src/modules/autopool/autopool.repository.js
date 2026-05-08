import mongoose from "mongoose";
import { AutopoolNodeModel } from "./autopool.model.js";

export const autopoolRepository = {
  // ─── Node Creation ──────────────────────────────────────────────────────────

  /**
   * Upsert-safe node creation. If a node with the same nodeId already exists
   * (e.g. from a retried transaction), it simply returns the existing document.
   * This replaces the old `.create()` which threw E11000 on retry.
   */
  createNode: async (payload, session = null) => {
    const opts = { upsert: true, new: true, setDefaultsOnInsert: true };
    if (session) opts.session = session;
    return AutopoolNodeModel.findOneAndUpdate(
      { nodeId: payload.nodeId },
      { $setOnInsert: payload },
      opts,
    );
  },

  createManyNodes: async (payloads, session = null) => {
    // insertMany is NOT upsert-safe; use serial upserts for idempotency
    const results = [];
    for (const payload of payloads) {
      results.push(await autopoolRepository.createNode(payload, session));
    }
    return results;
  },

  // ─── BFS Queue ──────────────────────────────────────────────────────────────

  /**
   * Find the next available parent slot using BFS ordering:
   * - status = "active" or "regenerated"
   * - childrenCount < 3
   * - oldest joinedAt first (millisecond precision)
   *
   * Accepts an optional session so reads are consistent within a transaction.
   */
  findNextAvailableParent: async (session = null) => {
    const query = AutopoolNodeModel.findOne({
      status: { $in: ["active", "regenerated"] },
      childrenCount: { $lt: 3 },
    }).sort({ childrenCount: 1, joinedAt: 1 }); // prefer less-filled nodes, then oldest
    if (session) query.session(session);
    return query.lean();
  },

  // ─── Node Reads ─────────────────────────────────────────────────────────────

  findById: async (id, session = null) => {
    const query = AutopoolNodeModel.findById(id);
    if (session) query.session(session);
    return query.lean();
  },

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
   * Returns the updated doc. If childrenCount reaches 3, marks it completed.
   *
   * Accepts an optional session so writes participate in the active transaction.
   */
  incrementChildrenCount: async (parentNodeId, session = null) => {
    const opts = { new: true };
    if (session) opts.session = session;

    const updated = await AutopoolNodeModel.findByIdAndUpdate(
      parentNodeId,
      { $inc: { childrenCount: 1 } },
      opts,
    );

    // If now full → mark completed (still within same session/transaction)
    if (updated && updated.childrenCount >= 3) {
      const completionOpts = session ? { session } : {};
      await AutopoolNodeModel.findByIdAndUpdate(
        parentNodeId,
        { status: "completed", completedAt: new Date() },
        completionOpts,
      );
      updated.status = "completed";
      updated.completedAt = new Date();
    }

    return updated;
  },

  updateStatus: async (nodeId, status, session = null) => {
    const opts = { new: true };
    if (session) opts.session = session;
    return AutopoolNodeModel.findByIdAndUpdate(nodeId, { status }, opts);
  },

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
