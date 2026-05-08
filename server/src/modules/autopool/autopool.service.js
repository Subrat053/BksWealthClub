import mongoose from "mongoose";
import { autopoolRepository } from "./autopool.repository.js";
import {
  buildDualNodePayloads,
  buildRebirthNodePayloads,
  resolveChildPosition,
  resolveChildLevel,
  calculateCompletionRewards,
  buildAutopoolIncomeEntry,
} from "./autopool.engine.js";
import { incomeService } from "../income/income.service.js";
import { WalletModel } from "../user/wallet.model.js";
import { User } from "../user/user.model.js";
import { AutopoolNodeModel } from "./autopool.model.js";

export const autopoolService = {
  // ─── 1. Activate Member → Create Dual IDs → Place in Pool ──────────────────

  /**
   * Called when admin approves a $75 deposit for a user.
   * Creates two AutopoolNodes (.1 active, .2 on_hold) and places .1 into BFS tree.
   *
   * IMPORTANT: accepts an existing `session` from the deposit approval transaction
   * so all operations are part of the SAME atomic transaction. No nested session.
   *
   * Uses upsert (set-on-insert) so repeated calls for the same memberId are safe
   * (idempotent — duplicate calls just return the already-created nodes).
   */
  activateMemberInAutopool: async ({ userId, memberId }, session = null) => {
    const dualPayloads = buildDualNodePayloads({
      userRef: userId,
      memberId,
      cycleNumber: 1,
    });

    // ── Upsert both nodes (safe against duplicate-key on retry) ───────────────
    const upsertOpts = session
      ? { upsert: true, new: true, setDefaultsOnInsert: true, session }
      : { upsert: true, new: true, setDefaultsOnInsert: true };

    const [activeNode, holdNode] = await Promise.all([
      AutopoolNodeModel.findOneAndUpdate(
        { nodeId: dualPayloads[0].nodeId },
        { $setOnInsert: dualPayloads[0] },
        upsertOpts,
      ),
      AutopoolNodeModel.findOneAndUpdate(
        { nodeId: dualPayloads[1].nodeId },
        { $setOnInsert: dualPayloads[1] },
        upsertOpts,
      ),
    ]);

    // ── Only place in BFS tree if the node has never been placed before ────────
    // We use the explicit isPlacedInTree flag for reliability.
    const needsPlacement = !activeNode.isPlacedInTree;

    let placedNode = activeNode;
    if (needsPlacement) {
      placedNode = await autopoolService._placeNodeInTree(activeNode._id, session);
    }

    return {
      activeNode,
      holdNode,
      placedAt: placedNode?.parentNodeRef || null,
      message: "Member activated. Two IDs created. Slot .1 placed in autopool.",
    };
  },

  // ─── 2. BFS Placement ──────────────────────────────────────────────────────

  /**
   * Internal: place a node into the BFS tree.
   * Finds the oldest unfilled parent and attaches this node as a child.
   * If the parent reaches 3 children → triggers completion workflow.
   */
  _placeNodeInTree: async (nodeId, session) => {
    // Pass session to findNextAvailableParent so we don't read stale data
    const parent = await autopoolRepository.findNextAvailableParent(session);

    if (!parent) {
      // Pool is empty (very first node) → this node IS the root
      const updateOpts = session ? { session, new: true } : { new: true };
      return await AutopoolNodeModel.findByIdAndUpdate(
        nodeId,
        { level: 0, parentNodeRef: null, positionUnderParent: null, isPlacedInTree: true },
        updateOpts,
      );
    }

    const position = resolveChildPosition(parent.childrenCount);
    const level = resolveChildLevel(parent.level);

    const updateOpts = session ? { session, new: true } : { new: true };

    // Attach child to parent
    await AutopoolNodeModel.findByIdAndUpdate(
      nodeId,
      {
        parentNodeRef: parent._id,
        positionUnderParent: position,
        level,
        isPlacedInTree: true,
      },
      updateOpts,
    );

    // Increment parent's children count (may trigger completion)
    // Pass session so the increment is part of the transaction
    const updatedParent = await autopoolRepository.incrementChildrenCount(
      parent._id,
      session
    );

    // If parent just completed → fire async completion workflow (outside main txn)
    if (updatedParent?.status === "completed") {
      setImmediate(() => {
        autopoolService
          ._handleNodeCompletion(updatedParent)
          .catch((err) => console.error("[Autopool] Completion error:", err));
      });
    }

    return await autopoolRepository.findById(nodeId, session);
  },

  // ─── 3. Node Completion → Income + Rebirth ─────────────────────────────────

  /**
   * Called when a node reaches 3 children.
   * 1. Calculates income for the node owner
   * 2. Credits withdrawable amount to wallet
   * 3. Creates rebirth nodes back into the pool (upsert-safe)
   * 4. Activates the on-hold (.2) slot if it was waiting
   */
  _handleNodeCompletion: async (completedNode) => {
    const { cycleNumber, withdrawable, rebirthIdCount } =
      calculateCompletionRewards(completedNode);

    const user = await User.findById(completedNode.userRef).lean();
    if (!user) return;

    // --- Credit autopool income (withdrawable portion) ---
    await incomeService.createEntry(
      buildAutopoolIncomeEntry({
        userRef: completedNode.userRef,
        nodeId: completedNode.nodeId,
        withdrawable,
        cycleNumber,
      }),
    );

    // --- Credit to wallet ---
    await WalletModel.findOneAndUpdate(
      { userRef: completedNode.userRef },
      { $inc: { mainWallet: withdrawable } },
      { upsert: true },
    );

    // --- Create rebirth nodes via upsert (safe on retry) ---
    const rebirthPayloads = buildRebirthNodePayloads({
      userRef: completedNode.userRef,
      memberId: user.memberId,
      completedNodeRef: completedNode._id,
      cycleNumber,
      rebirthIdCount,
    });

    for (const payload of rebirthPayloads) {
      const newNode = await AutopoolNodeModel.findOneAndUpdate(
        { nodeId: payload.nodeId },
        { $setOnInsert: payload },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      // Only place in tree if freshly upserted (never placed before)
      if (!newNode.isPlacedInTree) {
        await autopoolService._placeNodeInTree(newNode._id, null);
      }
    }

    // --- Activate the on_hold slot (.2) if this was a cycle 1 completion ---
    if (cycleNumber === 1) {
      const holdNode = await AutopoolNodeModel.findOne({
        userRef: completedNode.userRef,
        slotIndex: 2,
        status: "on_hold",
      }).lean();

      if (holdNode && !holdNode.isPlacedInTree) {
        await AutopoolNodeModel.findByIdAndUpdate(holdNode._id, {
          status: "active",
        });
        await autopoolService._placeNodeInTree(holdNode._id, null);
      }
    }

    console.log(
      `[Autopool] Node ${completedNode.nodeId} completed cycle ${cycleNumber}. ` +
        `Rewarded $${withdrawable}. Spawned ${rebirthIdCount} rebirth IDs.`,
    );
  },

  // ─── 4. Community Tree (Public View) ───────────────────────────────────────

  getCommunityTree: async () => {
    const nodes = await autopoolRepository.findAllNodes();
    return { nodes, total: nodes.length };
  },

  // ─── 5. Member's Own Tree View ─────────────────────────────────────────────

  getMemberTree: async ({ userId }) => {
    const userNodes = await autopoolRepository.findByUserRef(userId);
    if (!userNodes.length) {
      return { nodes: [], message: "No autopool nodes found for this member." };
    }

    const rootNode =
      userNodes.find((n) => n.status === "active") || userNodes[0];
    const subtree = await autopoolRepository.findSubtreeByNodeId(rootNode._id);

    return { rootNode, subtree, allUserNodes: userNodes };
  },

  // ─── 6. Admin: Pool Stats ──────────────────────────────────────────────────

  getPoolStats: async () => {
    const [active, onHold, completed, regenerated] = await Promise.all([
      autopoolRepository.countByStatus("active"),
      autopoolRepository.countByStatus("on_hold"),
      autopoolRepository.countByStatus("completed"),
      autopoolRepository.countByStatus("regenerated"),
    ]);

    return {
      active,
      onHold,
      completed,
      regenerated,
      total: active + onHold + completed + regenerated,
    };
  },
};
