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
import { ApiError } from "../../core/ApiError.js";

export const autopoolService = {
  // ─── 1. Activate Member → Create Dual IDs → Place in Pool ──────────────────

  /**
   * Called when admin approves a $75 deposit for a user.
   * Creates two AutopoolNodes (.1 active, .2 on_hold) and places .1 into BFS tree.
   * Also credits sponsor income.
   */
  activateMemberInAutopool: async ({ userId, memberId }) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // --- Build the two node payloads ---
      const dualPayloads = buildDualNodePayloads({
        userRef: userId,
        memberId,
        cycleNumber: 1,
      });

      // --- Insert both nodes ---
      const [activeNode, holdNode] = await Promise.all([
        autopoolRepository.createNode(dualPayloads[0]),
        autopoolRepository.createNode(dualPayloads[1]),
      ]);

      // --- Place the active node (.1) in BFS tree ---
      const placedNode = await autopoolService._placeNodeInTree(
        activeNode._id,
        session,
      );

      // --- Mark user as activated ---
      await User.findByIdAndUpdate(userId, {
        isActivated: true,
        status: "active",
      }).session(session);

      // ── Sponsor income is now handled by incomeDistribution.service.js ──────
      // When the deposit is approved, deposit.service.js calls
      // distributeDepositIncome() which credits sponsor income, level income,
      // superadmin funds, and rebirth wallets. No duplicate credit here.

      await session.commitTransaction();

      return {
        activeNode,
        holdNode,
        placedAt: placedNode?.parentNodeRef || null,
        message:
          "Member activated. Two IDs created. Slot .1 placed in autopool.",
      };
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  },

  // ─── 2. BFS Placement ──────────────────────────────────────────────────────

  /**
   * Internal: place a node into the BFS tree.
   * Finds the oldest unfilled parent and attaches this node as a child.
   * If the parent reaches 3 children → triggers completion workflow.
   */
  _placeNodeInTree: async (nodeId, session) => {
    const parent = await autopoolRepository.findNextAvailableParent();

    if (!parent) {
      // Pool is empty (very first node) → this node IS the root
      await mongoose
        .model("AutopoolNode")
        .findByIdAndUpdate(
          nodeId,
          { level: 0, parentNodeRef: null, positionUnderParent: null },
          { session },
        );
      return await autopoolRepository.findById(nodeId);
    }

    const position = resolveChildPosition(parent.childrenCount);
    const level = resolveChildLevel(parent.level);

    // Attach child to parent
    await mongoose.model("AutopoolNode").findByIdAndUpdate(
      nodeId,
      {
        parentNodeRef: parent._id,
        positionUnderParent: position,
        level,
      },
      { session },
    );

    // Increment parent's children count (may trigger completion)
    const updatedParent = await autopoolRepository.incrementChildrenCount(
      parent._id,
    );

    // If parent just completed → fire async completion workflow
    if (updatedParent?.status === "completed") {
      // Don't await — let it run in background so placement doesn't block
      setImmediate(() => {
        autopoolService
          ._handleNodeCompletion(updatedParent)
          .catch((err) => console.error("[Autopool] Completion error:", err));
      });
    }

    return await autopoolRepository.findById(nodeId);
  },

  // ─── 3. Node Completion → Income + Rebirth ─────────────────────────────────

  /**
   * Called when a node reaches 3 children.
   * 1. Calculates income for the node owner
   * 2. Credits withdrawable amount to wallet
   * 3. Creates rebirth nodes back into the pool
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

    // --- Create rebirth nodes and place them in pool ---
    const rebirthPayloads = buildRebirthNodePayloads({
      userRef: completedNode.userRef,
      memberId: user.memberId,
      completedNodeRef: completedNode._id,
      cycleNumber,
      rebirthIdCount,
    });

    for (const payload of rebirthPayloads) {
      const newNode = await autopoolRepository.createNode(payload);
      await autopoolService._placeNodeInTree(newNode._id, null);
    }

    // --- Activate the on_hold slot (.2) if this was a cycle 1 completion ---
    // The .2 node enters the pool after the member's structure completes once
    if (cycleNumber === 1) {
      const holdNode = await mongoose
        .model("AutopoolNode")
        .findOne({
          userRef: completedNode.userRef,
          slotIndex: 2,
          status: "on_hold",
        })
        .lean();

      if (holdNode) {
        await mongoose
          .model("AutopoolNode")
          .findByIdAndUpdate(holdNode._id, { status: "active" });
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

    // Return the subtree rooted at member's first active node
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
