/**
 * AutoPool 3x3 Matrix Service
 *
 * Implements 3x3 Matrix AutoPool with Rebirth IDs.
 * Features:
 * - FIFO queue placement
 * - Node completion on 3 direct children
 * - Automatic rebirth generation for completed nodes
 * - Duplicate prevention
 * - Concurrent safety with MongoDB transactions
 */

import mongoose from "mongoose";
import { AutoPoolNode } from "./autopool-matrix.model.js";
import { RebirthId } from "./rebirth.model.js";
import { AutoPoolLevelCounter } from "./autopool-level-counter.model.js";
import { DepositModel } from "../deposit/deposit.model.js";
import { User } from "../user/user.model.js";
import { AdminModel } from "../admin/admin.model.js";
import { AutoPoolLevelCompletion } from "./autopool-level-completion.model.js";
import { env } from "../../config/env.js";
import { autopoolFundService } from "./autopool-fund.service.js";

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 100;
let isProcessing3x3Queue = false;

const escapeRegExp = (value = "") =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ─── Retry Wrapper for Transient Errors ────────────────────────────────────────
async function withTransactionRetry(fn, retries = MAX_RETRIES) {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt++) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction({
        readConcern: { level: "snapshot" },
        writeConcern: { w: "majority" },
      });
      const result = await fn(session);
      await session.commitTransaction();
      return result;
    } catch (err) {
      await session.abortTransaction().catch(() => {});
      lastError = err;

      const isTransient =
        err?.errorLabels?.includes("TransientTransactionError") ||
        err?.errorResponse?.errorLabels?.includes(
          "TransientTransactionError",
        ) ||
        err?.code === 112; // WriteConflict

      if (isTransient && attempt < retries) {
        console.warn(
          `[AutoPool] Transient error (attempt ${attempt}/${retries}), retrying...`,
          err.message,
        );
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
        continue;
      }
      throw err;
    } finally {
      session.endSession();
    }
  }
  throw lastError;
}

// ─── Rebirth Code Generation ────────────────────────────────────────────────────
/**
 * Format: MEMBERID-LEVEL.SEQUENCE
 * Round 0: BKS12345-0.1, BKS12345-0.2
 * Round 1: BKS12345-1.1, BKS12345-1.2, BKS12345-1.3, BKS12345-1.4
 */
export function generateRebirthCode({ memberId, level, sequence }) {
  return `${memberId}-${level}.${sequence}`;
}

/**
 * Generate the 2 initial rebirth codes for a new user (Level 0)
 */
export function generateInitialRebirthCodes(memberId) {
  return [
    generateRebirthCode({ memberId, level: 0, sequence: 1 }),
    generateRebirthCode({ memberId, level: 0, sequence: 2 }),
  ];
}

// ─── Root Management ────────────────────────────────────────────────────────────

/**
 * Ensure the Operational Admin exists in the User collection
 */
async function ensureOperationalAdmin(session = null) {
  const memberId = env.OPERATIONAL_ADMIN_MEMBER_ID || "BK000000";
  const email = "operational@bkswealthclub.local";

  let user = await User.findOne({ memberId }).session(session);
  if (!user) {
    // If not found, it should be created by seed script, but we handle it here just in case
    console.warn(
      `[AutoPool] Operational Admin ${memberId} not found. Ensure seeding is complete.`,
    );
  }
  return user;
}

/**
 * Ensure the AutoPool Root node exists for Operational Admin
 */
async function ensureAutoPoolRoot(session = null) {
  const memberId = env.OPERATIONAL_ADMIN_MEMBER_ID || "BK000000";
  const user = await ensureOperationalAdmin(session);
  if (!user) return null;

  // Find by nodeCode regardless of nodeType to prevent duplicate key error
  let rootNode = await AutoPoolNode.findOne({
    nodeCode: memberId,
  }).session(session);

  if (!rootNode) {
    console.log(`[AutoPool] Creating AutoPool Root for ${memberId}`);
    const results = await AutoPoolNode.create(
      [
        {
          ownerUserId: user._id,
          nodeCode: memberId,
          nodeId: memberId,
          nodeType: "ROOT",
          userId: user._id,
          status: "PLACED", // Root is always placed
          isRoot: true,
          isOperationalRoot: true,
          queueTimestamp: new Date("2000-01-01T00:00:00Z"),
        },
      ],
      { session },
    );

    rootNode = Array.isArray(results) ? results[0] : results;
  } else {
    // If it exists but has wrong type or status, fix it
    if (
      rootNode.nodeType !== "ROOT" ||
      rootNode.status !== "PLACED" ||
      !rootNode.isRoot
    ) {
      console.log(
        `[AutoPool] Updating existing node ${memberId} to ROOT status`,
      );
      rootNode.nodeType = "ROOT";
      rootNode.status = "PLACED";
      rootNode.isRoot = true;
      rootNode.isOperationalRoot = true;
      rootNode.matrixParentId = null;
      rootNode.parentNodeId = null;
      rootNode.queueTimestamp = new Date("2000-01-01T00:00:00Z");
      await rootNode.save({ session });
    }
  }

  return rootNode;
}

/**
 * Ensure initial Admin Rebirths exist and are ENQUEUED
 * Format: MEMBERID-LEVEL.SEQUENCE
 */
async function ensureAdminInitialRebirths(session = null) {
  const memberId = "BKS000000";
  const user = await User.findOne({ memberId }).session(session);
  if (!user) return;

  for (let i = 1; i <= 2; i++) {
    const displayCode = `${memberId}-0.${i}`;
    let node = await AutoPoolNode.findOne({ displayCode }).session(session);
    if (!node) {
      console.log(`[AutoPool] Enqueuing Admin Rebirth Node: ${displayCode}`);
      await AutoPoolNode.create(
        [
          {
            ownerUserId: user._id,
            ownerMemberId: memberId,
            nodeCode: displayCode,
            displayCode: displayCode,
            nodeId: displayCode,
            nodeType: "REBIRTH",
            levelNumber: 0,
            levelSequence: i,
            status: "PENDING", // Enqueued as per rules
            queueTimestamp: new Date("2000-01-01T00:00:00Z"), // Old timestamp to ensure priority
          },
        ],
        { session },
      );
    }
  }
}

// ─── Core Service Functions ────────────────────────────────────────────────────

export const autopool3x3Service = {
  /**
   * Process successful deposit for AutoPool
   * 1. Check if rebirth IDs already exist
   * 2. Create initial rebirth IDs if not
   * 3. Create AutoPool nodes
   * 4. Add nodes to queue
   */
  processDepositSuccessForAutoPool: async (depositIdOrDoc, session = null) => {
    const fn = async (s) => {
      let deposit;
      if (
        depositIdOrDoc &&
        typeof depositIdOrDoc === "object" &&
        depositIdOrDoc._id
      ) {
        deposit = depositIdOrDoc;
      } else {
        deposit = await DepositModel.findById(depositIdOrDoc).session(s);
      }

      if (!deposit) throw new Error(`Deposit ${depositIdOrDoc} not found`);

      // Guard: already processed?
      if (deposit.autoPoolProcessed) {
        console.log(
          `[AutoPool] Deposit ${deposit._id} already processed, skipping`,
        );
        return { skipped: true, message: "Already processed" };
      }

      // Fetch user
      const user = await User.findById(deposit.userRef).session(s);
      if (!user) throw new Error(`User ${deposit.userRef} not found`);

      // 1. Activate user (if not already)
      if (user.status !== "active") {
        user.status = "active";
        user.isActive = true;
        user.isActivated = true;
        user.activationStatus = "ACTIVE";
        user.activatedAt = new Date();
        await user.save({ session: s });
      }

      // Ensure root exists
      await ensureAutoPoolRoot(s);

      // 2. Generate initial rebirth nodes (MEMBERID-0.1, MEMBERID-0.2)
      const rebirthNodes =
        await autopool3x3Service.createInitialRebirthsForUser(
          user._id,
          deposit._id,
          user.memberId,
          s,
        );

      // 3. ONLY rebirth IDs enter AutoPool queue
      for (const node of rebirthNodes) {
        await autopool3x3Service.enqueueAutoPoolNode(node._id, s);
      }

      // Mark deposit processed
      deposit.autoPoolProcessed = true;
      if (deposit.save) await deposit.save({ session: s });

      return {
        depositId: deposit._id,
        userId: user._id,
        rebirthNodeIds: rebirthNodes.map((n) => n._id),
      };
    };

    return session ? fn(session) : withTransactionRetry(fn);
  },

  /**
   * Manually activate a user in the 3x3 AutoPool system (without a deposit)
   * Used for Operational Admin seeding or manual adjustments.
   */
  activateUserIn3x3AutoPool: async (userId, memberId, session = null) => {
    const fn = async (s) => {
      // 1. Create initial rebirths (0.1 and 0.2)
      const rebirthNodes =
        await autopool3x3Service.createInitialRebirthsForUser(
          userId,
          null, // No deposit
          memberId,
          s,
        );

      // 2. Enqueue only rebirth nodes
      for (const node of rebirthNodes) {
        await autopool3x3Service.enqueueAutoPoolNode(node._id, s);
      }

      console.log(
        `[AutoPool] Manually activated ${memberId} in 3x3 AutoPool with rebirth nodes`,
      );

      return {
        userId,
        memberId,
        rebirthNodeIds: rebirthNodes.map((n) => n._id),
      };
    };

    return session ? fn(session) : withTransactionRetry(fn);
  },

  /**
   * Create 2 initial rebirth IDs for a user on their first deposit
   */
  createInitialRebirthsForUser: async (
    userId,
    depositId,
    memberId,
    session = null,
  ) => {
    const fn = async (s) => {
      const rebirthNodes = [];

      // Initial rebirths are at level 0
      const levelNumber = 0;

      for (let i = 1; i <= 2; i++) {
        const displayCode = generateRebirthCode({
          memberId: memberId,
          level: 0,
          sequence: i,
        });

        // Atomic check/create to prevent duplicates
        let node = await AutoPoolNode.findOne({ displayCode }).session(s);
        if (!node) {
          const results = await AutoPoolNode.create(
            [
              {
                ownerUserId: userId,
                ownerMemberId: memberId,
                nodeCode: displayCode,
                displayCode: displayCode,
                nodeId: displayCode,
                nodeType: "REBIRTH",
                levelNumber: 0,
                levelSequence: i,
                depositId: depositId,
                status: "PENDING",
                queueTimestamp: new Date(),
              },
            ],
            { session: s },
          );
          node = results[0];
        }
        rebirthNodes.push(node);
      }

      return rebirthNodes;
    };

    return session ? fn(session) : withTransactionRetry(fn);
  },

  /**
   * Create AutoPool node for main user
   */
  createAutoPoolNodeForMainUser: async (
    userId,
    depositId,
    memberId,
    session = null,
  ) => {
    const fn = async (s) => {
      // Check for duplicate by userId/type OR by nodeCode (unique index)
      const existing = await AutoPoolNode.findOne({
        $or: [{ userId, nodeType: "MAIN", depositId }, { nodeCode: memberId }],
      }).session(s);

      if (existing) {
        console.log(
          `[AutoPool] Node with code ${memberId} already exists, reusing`,
        );
        return existing;
      }

      // Create node
      const node = await AutoPoolNode.create(
        [
          {
            ownerUserId: userId,
            nodeCode: memberId,
            nodeType: "MAIN",
            userId,
            depositId,
            status: "PENDING",
            queueTimestamp: new Date(),
          },
        ],
        { session: s },
      );

      return node[0];
    };

    return session ? fn(session) : withTransactionRetry(fn);
  },

  /**
   * Create AutoPool node for rebirth ID
   */
  createAutoPoolNodeForRebirth: async (rebirthId, session = null) => {
    const fn = async (s) => {
      // Fetch rebirth details
      const rebirth = await RebirthId.findById(rebirthId).session(s);
      if (!rebirth) throw new Error(`Rebirth ${rebirthId} not found`);

      // Check for duplicate
      const existing = await AutoPoolNode.findOne({
        rebirthId,
        nodeType: "REBIRTH",
      }).session(s);

      if (existing) {
        console.log(
          `[AutoPool] Rebirth node already exists for ${rebirth.rebirthCode}, reusing`,
        );
        return existing;
      }

      // Create node
      const node = await AutoPoolNode.create(
        [
          {
            ownerUserId: rebirth.ownerUserId,
            nodeCode: rebirth.rebirthCode,
            nodeId: rebirth.rebirthCode,
            nodeType: "REBIRTH",
            rebirthId,
            rebirthCode: rebirth.rebirthCode,
            depositId: rebirth.depositId,
            generatedFromNodeId:
              rebirth.generatedFromNodeId || rebirth.generatedFromPoolNodeId,
            status: "PENDING",
            queueTimestamp: new Date(),
          },
        ],
        { session: s },
      );

      return node[0];
    };

    return session ? fn(session) : withTransactionRetry(fn);
  },

  /**
   * Enqueue AutoPool node for processing
   */
  enqueueAutoPoolNode: async (nodeId, session = null) => {
    const fn = async (s) => {
      const node = await AutoPoolNode.findById(nodeId).session(s);
      if (!node) throw new Error(`Node ${nodeId} not found`);

      if (node.status !== "PENDING") {
        console.log(
          `[AutoPool] Node ${node.nodeCode} not in PENDING state, skipping enqueue`,
        );
        return node;
      }

      // Node is already in pending state with queueTimestamp, no additional queue needed
      return node;
    };

    return session ? fn(session) : withTransactionRetry(fn);
  },

  /**
   * Process AutoPool queue using FIFO placement
   * Finds oldest pending nodes and places them under oldest available parents
   */
  findNextAvailableParent: async (session = null) => {
    // 1. Try to find the Admin ROOT node (BKS000000) if it has space
    const adminRoot = await AutoPoolNode.findOne({
      nodeCode: "BKS000000",
      status: "PLACED",
      directChildrenCount: { $lt: 3 },
    }).session(session);

    if (adminRoot) return adminRoot;

    // 2. Find oldest placed REBIRTH node with capacity
    // ROOT nodes other than BKS000000 (if any) are excluded here
    return await AutoPoolNode.findOne({
      status: "PLACED",
      directChildrenCount: { $lt: 3 },
      nodeType: "REBIRTH",
    })
      .sort({ queueTimestamp: 1 })
      .session(session);
  },

  processAutoPoolQueue: async (session = null) => {
    if (!session) {
      if (isProcessing3x3Queue) {
        console.log("[AutoPool] 3x3 Queue already processing, skipping.");
        return { placedCount: 0, skipped: true };
      }
      isProcessing3x3Queue = true;
    }

    try {
      const fn = async (s) => {
        const MAX_PROCESS_PER_RUN = 100;
        let placedCount = 0;

        // Ensure root and admin rebirths exist
        await ensureAutoPoolRoot(s);
        await ensureAdminInitialRebirths(s);

        while (placedCount < MAX_PROCESS_PER_RUN) {
          // 1. Find oldest pending node
          const pendingNode = await AutoPoolNode.findOne({
            status: "PENDING",
          })
            .sort({ queueTimestamp: 1 })
            .session(s);

          if (!pendingNode) break;

          // 2. Find oldest available parent
          const availableParent =
            await autopool3x3Service.findNextAvailableParent(s);

          if (!availableParent) {
            // If no available parent, and this is the admin root node itself (shouldn't happen if ensureAutoPoolRoot ran)
            if (
              pendingNode.nodeCode ===
              (env.OPERATIONAL_ADMIN_MEMBER_ID || "BK000000")
            ) {
              pendingNode.status = "PLACED";
              pendingNode.matrixParentId = null;
              pendingNode.parentNodeId = null;
              pendingNode.isRoot = true;
              await pendingNode.save({ session: s });
              placedCount++;
              continue;
            }
            console.warn(
              `[AutoPool] No available parent found for ${pendingNode.nodeCode}. Matrix might be corrupted or root missing.`,
            );
            break;
          }

          // 3. Place pending node under parent (atomic update)
          const updateResult = await AutoPoolNode.findOneAndUpdate(
            {
              _id: availableParent._id,
              directChildrenCount: { $lt: 3 }, // Atomic condition
            },
            {
              $push: { directChildren: pendingNode._id },
              $inc: { directChildrenCount: 1 },
            },
            { new: true, session: s },
          );

          if (!updateResult) {
            // Parent got filled by concurrent transaction or retry, loop again to find new parent
            continue;
          }

          placedCount++;

          // 4. Update child node status to PLACED
          pendingNode.status = "PLACED";
          pendingNode.matrixParentId = availableParent._id;
          pendingNode.parentNodeId = availableParent._id;
          await pendingNode.save({ session: s });

          console.log(
            `[AutoPool] Placed node ${pendingNode.nodeCode} under ${availableParent.nodeCode}`,
          );

          // 5. Check if parent is now complete
          if (updateResult.directChildrenCount === 3) {
            await autopool3x3Service.completeAutoPoolNode(updateResult._id, s);
          }
        }

        return {
          placedCount,
          completed: placedCount === 0,
        };
      };

      return session ? fn(session) : await withTransactionRetry(fn);
    } finally {
      if (!session) {
        isProcessing3x3Queue = false;
      }
    }
  },

  /**
   * Complete an AutoPool node
   */
  completeAutoPoolNode: async (nodeId, session = null) => {
    const fn = async (s) => {
      const node = await AutoPoolNode.findById(nodeId).session(s);
      if (!node) throw new Error(`Node ${nodeId} not found`);

      if (node.status === "COMPLETED") {
        return node;
      }

      // Mark as completed
      node.status = "COMPLETED";
      node.completedAt = new Date();
      await node.save({ session: s });

      console.log(`[AutoPool] Completed node: ${node.nodeCode}`);

      // --- FUND MANAGEMENT HOOK ---
      // Process individual rebirth completion payout ($60)
      if (node.nodeType === "REBIRTH") {
        await autopoolFundService.processRebirthCompletionFund(node._id, s);
      }

      // Check User Level Completion
      await autopool3x3Service.checkUserAutoPoolLevelCompletion(
        node.ownerUserId,
        node.levelNumber,
        s,
      );

      return node;
    };

    return session ? fn(session) : withTransactionRetry(fn);
  },

  /**
   * Generate next level rebirth IDs for a completed level (Round N -> Round N+1)
   */
  generateNextLevelRebirthsForCompletedLevel: async (
    ownerUserId,
    completedLevel,
    session = null,
  ) => {
    const fn = async (s) => {
      const user = await User.findById(ownerUserId).session(s);
      if (!user) return;

      const nextLevel = completedLevel + 1;
      if (nextLevel > 9) {
        console.log(`[AutoPool] Level 9 completed. No Level 10 rebirths generated. Stopping.`);
        user.lifecycleStoppedAfterRound9 = true;
        await user.save({ session: s });
        return;
      }

      const memberId = user.memberId;
      // Formula for next round rebirth count: 2^(nextLevel + 1)
      const nextLevelRebirthCount = Math.pow(2, nextLevel + 1);

      console.log(`[AutoPool] Generating ${nextLevelRebirthCount} rebirth nodes for ${memberId} for Level ${nextLevel}`);

      const rebirthNodes = [];
      for (let i = 1; i <= nextLevelRebirthCount; i++) {
        const displayCode = generateRebirthCode({
          memberId,
          level: nextLevel,
          sequence: i,
        });

        let newNode = await AutoPoolNode.findOne({ nodeCode: displayCode }).session(s);
        if (!newNode) {
          const results = await AutoPoolNode.create(
            [
              {
                ownerUserId,
                ownerMemberId: memberId,
                nodeCode: displayCode,
                displayCode: displayCode,
                nodeId: displayCode,
                nodeType: "REBIRTH",
                levelNumber: nextLevel,
                levelSequence: i,
                status: "PENDING",
                queueTimestamp: new Date(),
              },
            ],
            { session: s },
          );
          newNode = results[0];
          console.log(`[AutoPool] Created level-wide rebirth node ${displayCode}`);
        }
        rebirthNodes.push(newNode);
      }

      // Enqueue all newly created rebirth nodes
      for (const node of rebirthNodes) {
        await autopool3x3Service.enqueueAutoPoolNode(node._id, s);
      }
    };

    return session ? fn(session) : withTransactionRetry(fn);
  },

  /**
   * Check User Level Completion
   * Level completes when expectedNodeCount (2^(level+1)) nodes are COMPLETED
   */
  checkUserAutoPoolLevelCompletion: async (
    ownerUserId,
    levelNumber,
    session = null,
  ) => {
    const fn = async (s) => {
      const user = await User.findById(ownerUserId).session(s);
      if (!user) return;

      const expectedNodeCount = Math.pow(2, levelNumber + 1);
      const completedNodeCount = await AutoPoolNode.countDocuments({
        ownerUserId,
        levelNumber,
        status: "COMPLETED",
      }).session(s);

      if (completedNodeCount >= expectedNodeCount) {
        // Prevent duplicate completion
        const existing = await AutoPoolLevelCompletion.findOne({
          ownerUserId,
          levelNumber,
        }).session(s);

        if (!existing || !existing.isCompleted) {
          await AutoPoolLevelCompletion.findOneAndUpdate(
            { ownerUserId, levelNumber },
            {
              ownerMemberId: user.memberId,
              autoPoolNumber: levelNumber + 1,
              expectedNodeCount,
              completedNodeCount,
              isCompleted: true,
              completedAt: new Date(),
            },
            { upsert: true, session: s },
          );

          await User.findByIdAndUpdate(
            ownerUserId,
            {
              $set: { currentCompletedAutopoolRound: levelNumber },
              $addToSet: { processedAutopoolRounds: levelNumber },
            },
            { session: s }
          );

          console.log(
            `[AutoPool] User ${user.memberId} completed Level ${levelNumber} (AutoPool ${levelNumber + 1})`,
          );

          // --- FUND MANAGEMENT HOOK ---
          // Process full level distribution (Withdrawal, Reinvest, Sponsor, etc.)
          await autopoolFundService.processLevelDistribution(
            ownerUserId,
            levelNumber,
            s,
          );

          // Generate next-level rebirth nodes (level-wide)
          await autopool3x3Service.generateNextLevelRebirthsForCompletedLevel(
            ownerUserId,
            levelNumber,
            s,
          );
        }
      } else {
        // Update progress if not completed
        await AutoPoolLevelCompletion.findOneAndUpdate(
          { ownerUserId, levelNumber },
          {
            ownerMemberId: user.memberId,
            autoPoolNumber: levelNumber + 1,
            expectedNodeCount,
            completedNodeCount,
            isCompleted: false,
          },
          { upsert: true, session: s },
        );
      }
    };

    return session ? fn(session) : withTransactionRetry(fn);
  },

  // ─── Query Functions ────────────────────────────────────────────────────────

  /**
   * Get user's AutoPool tree
   */
  getUserAutoPoolTree: async (userId) => {
    const nodes = await AutoPoolNode.find({ ownerUserId: userId })
      .populate("matrixParentId", "nodeCode nodeType status")
      .populate("directChildren", "nodeCode nodeType status")
      .populate("rebirthId", "displayCode")
      .sort({ createdAt: 1 });

    return nodes;
  },

  /**
   * Get operational admin's scoped AutoPool tree
   */
  getOperationalAdminMyTree: async (auth = {}) => {
    const adminAuthId = auth.adminId || auth.sub || auth.userId || null;
    const userAuthId = auth.userId || auth.sub || null;

    let adminAccount = null;
    let adminUser = null;

    if (adminAuthId) {
      adminAccount = await AdminModel.findById(adminAuthId)
        .select("username sponsorId email role")
        .lean();

      if (adminAccount?.sponsorId) {
        adminUser = await User.findOne({ memberId: adminAccount.sponsorId })
          .select("memberId fullName isOperationalAdmin isSystemRoot")
          .lean();
      }
    }

    if (!adminUser && userAuthId) {
      adminUser = await User.findById(userAuthId)
        .select("memberId fullName isOperationalAdmin isSystemRoot")
        .lean();
    }

    if (!adminUser && auth.memberId) {
      adminUser = await User.findOne({ memberId: auth.memberId })
        .select("memberId fullName isOperationalAdmin isSystemRoot")
        .lean();
    }

    if (!adminUser && adminAccount?.email) {
      adminUser = await User.findOne({ email: adminAccount.email })
        .select("memberId fullName isOperationalAdmin isSystemRoot")
        .lean();
    }

    if (!adminUser) {
      return null;
    }

    const allScopedCandidates = await AutoPoolNode.find({
      nodeType: { $in: ["ROOT", "REBIRTH"] },
    })
      .populate("ownerUserId", "memberId fullName")
      .populate(
        "matrixParentId",
        "nodeCode nodeType status directChildrenCount createdAt",
      )
      .populate({
        path: "rebirthId",
        select:
          "displayCode ownerUserId ownerMemberId levelNumber levelSequence status createdAt",
        populate: {
          path: "ownerUserId",
          select: "memberId fullName",
        },
      })
      .sort({ createdAt: 1 })
      .lean();

    const rootNode = allScopedCandidates.find(
      (node) =>
        node.nodeCode === adminUser.memberId &&
        (node.isRoot || node.nodeType === "ROOT"),
    );

    let nodes = [];
    if (rootNode) {
      const byParent = new Map();
      for (const node of allScopedCandidates) {
        const parentId =
          node.matrixParentId?._id?.toString() ||
          node.matrixParentId?.toString();
        if (!parentId) continue;
        if (!byParent.has(parentId)) byParent.set(parentId, []);
        byParent.get(parentId).push(node);
      }

      const included = new Map();
      const queue = [rootNode];
      while (queue.length) {
        const current = queue.shift();
        const currentId = current._id.toString();
        if (included.has(currentId)) continue;
        included.set(currentId, current);
        const children = byParent.get(currentId) || [];
        for (const child of children) {
          if (!included.has(child._id.toString())) {
            queue.push(child);
          }
        }
      }

      nodes = Array.from(included.values()).sort(
        (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
      );
    }

    if (!nodes.length) {
      const memberIdRegex = new RegExp(
        `^${escapeRegExp(adminUser.memberId)}(?:-|$)`,
        "i",
      );

      const candidateNodes = allScopedCandidates.filter(
        (node) =>
          node.ownerMemberId === adminUser.memberId ||
          memberIdRegex.test(node.nodeCode || "") ||
          memberIdRegex.test(node.displayCode || ""),
      );

      if (candidateNodes.length) {
        const byParent = new Map();
        for (const node of allScopedCandidates) {
          const parentId =
            node.matrixParentId?._id?.toString() ||
            node.matrixParentId?.toString();
          if (!parentId) continue;
          if (!byParent.has(parentId)) byParent.set(parentId, []);
          byParent.get(parentId).push(node);
        }

        const included = new Map();
        const queue = [...candidateNodes];
        while (queue.length) {
          const current = queue.shift();
          const currentId = current._id.toString();
          if (included.has(currentId)) continue;
          included.set(currentId, current);
          const children = byParent.get(currentId) || [];
          for (const child of children) {
            if (!included.has(child._id.toString())) {
              queue.push(child);
            }
          }
        }

        nodes = Array.from(included.values()).sort(
          (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
        );
      }
    }

    const rebirths = await RebirthId.find({ ownerUserId: adminUser._id })
      .populate("ownerUserId", "memberId fullName")
      .sort({ levelNumber: 1, levelSequence: 1, createdAt: 1 })
      .lean();

    const mappedNodes = nodes.map((node) => {
      const ownerUser = node.ownerUserId || {};
      const rebirthDoc = node.rebirthId || {};
      const rebirthId =
        rebirthDoc.displayCode || node.rebirthCode || node.nodeCode;

      return {
        ...node,
        poolNodeId: node.nodeCode,
        parentPoolNodeId: node.matrixParentId
          ? {
              ...node.matrixParentId,
              poolNodeId: node.matrixParentId.nodeCode,
            }
          : null,
        linkedRebirthNodeId: {
          rebirthId,
          ownerUserId: {
            _id: ownerUser._id || userId,
            fullName: ownerUser.fullName || admin.fullName,
            memberId: ownerUser.memberId || admin.memberId,
          },
          ownerName: ownerUser.fullName || admin.fullName,
          memberId: ownerUser.memberId || admin.memberId,
          round: node.levelNumber ?? rebirthDoc.levelNumber ?? 0,
          sequence: node.levelSequence ?? rebirthDoc.levelSequence ?? 0,
          amount: rebirthDoc.amount ?? rebirthDoc.fundAmount ?? null,
        },
        autopoolChildrenCount: node.directChildrenCount || 0,
      };
    });

    const completions = rebirths.map((rebirth) => ({
      _id: rebirth._id,
      rebirthId: rebirth.displayCode || rebirth.rebirthCode,
      ownerUserId: {
        _id: rebirth.ownerUserId?._id || userId,
        fullName: rebirth.ownerUserId?.fullName || admin.fullName,
        memberId: rebirth.ownerUserId?.memberId || admin.memberId,
      },
      ownerName: rebirth.ownerUserId?.fullName || admin.fullName,
      round: rebirth.levelNumber ?? 0,
      sequence: rebirth.levelSequence ?? 0,
      amount: rebirth.amount ?? rebirth.fundAmount ?? null,
      status: rebirth.status,
      createdAt: rebirth.createdAt,
    }));

    const completedNodes = mappedNodes.filter(
      (node) => node.status === "COMPLETED",
    ).length;
    const pendingNodes = mappedNodes.filter(
      (node) => node.status === "PENDING",
    ).length;
    const placedNodes = mappedNodes.filter(
      (node) => node.status === "PLACED",
    ).length;
    const activeRebirths = rebirths.filter(
      (rebirth) => rebirth.status !== "COMPLETED",
    ).length;

    return {
      admin: {
        _id: adminAccount?._id || adminUser._id,
        name: adminUser.fullName,
        adminId: adminAccount?.sponsorId || adminUser.memberId,
      },
      nodes: mappedNodes,
      completions,
      summary: {
        totalNodes: mappedNodes.length,
        completedNodes,
        pendingNodes,
        placedNodes,
        pendingPlacedNodes: pendingNodes + placedNodes,
        activeRebirths,
      },
    };
  },

  /**
   * Get user's rebirth IDs
   */
  getUserRebirths: async (userId) => {
    const rebirths = await RebirthId.find({ ownerUserId: userId }).sort({
      levelNumber: 1,
      levelSequence: 1,
    });

    return rebirths;
  },

  /**
   * Get AutoPool tree (admin)
   */
  getAutoPoolTree: async (limit = 100) => {
    let query = AutoPoolNode.find()
      .populate("ownerUserId", "memberId email fullName")
      .populate("matrixParentId", "nodeCode")
      .populate("userId", "memberId")
      .populate("rebirthId", "displayCode")
      .sort({ queueTimestamp: 1 });

    if (limit > 0) {
      query = query.limit(limit);
    }

    const nodes = await query;
    return nodes;
  },

  /**
   * Get AutoPool queue status
   */
  /**
   * Get AutoPool queue status
   */
  getQueueStatus: async () => {
    const totalEntries = await AutoPoolNode.countDocuments({
      nodeType: "REBIRTH",
    });
    const pendingEntries = await AutoPoolNode.countDocuments({
      nodeType: "REBIRTH",
      status: "PENDING",
    });
    const placedEntries = await AutoPoolNode.countDocuments({
      nodeType: "REBIRTH",
      status: "PLACED",
    });
    const completedEntries = await AutoPoolNode.countDocuments({
      nodeType: "REBIRTH",
      status: "COMPLETED",
    });

    return {
      totalEntries,
      pendingEntries,
      placedEntries,
      completedEntries,
      totalRebirths: totalEntries, // In 3x3, almost everything is a rebirth node
      queueWaiting: pendingEntries,
      queueProcessing: 0,
    };
  },

  /**
   * Get AutoPool queue nodes (list)
   */
  getQueueNodes: async (limit = 100, page = 1, returnTotal = false, search = "") => {
    const skip = (page - 1) * limit;
    const filter = { nodeType: "REBIRTH" };
    if (search) {
      const matchingUsers = await User.find({
        $or: [
          { fullName: { $regex: search, $options: "i" } },
          { memberId: { $regex: search, $options: "i" } }
        ]
      }).select("_id").lean();
      
      const matchingUserIds = matchingUsers.map(u => u._id);
      
      filter.$or = [
        { nodeCode: { $regex: search, $options: "i" } },
        { ownerUserId: { $in: matchingUserIds } }
      ];
    }

    let query = AutoPoolNode.find(filter)
      .populate("ownerUserId", "fullName memberId")
      .populate("matrixParentId", "nodeCode")
      .sort({ queueTimestamp: 1 });

    if (limit > 0) {
      query = query.skip(skip).limit(limit);
    }

    const nodes = await query;

    if (returnTotal) {
      const total = await AutoPoolNode.countDocuments(filter);
      return { nodes, total };
    }
    return nodes;
  },

  /**
   * Get completed nodes (admin)
   */
  getCompletedNodes: async (limit = 100) => {
    const nodes = await AutoPoolNode.find({ status: "COMPLETED" })
      .populate("ownerUserId", "memberId email")
      .sort({ completedAt: -1 })
      .limit(limit);

    return nodes;
  },

  /**
   * Get user's AutoPool details (admin)
   */
  getUserAutoPoolDetails: async (userId) => {
    const user = await User.findById(userId).select("memberId email");
    const nodes = await AutoPoolNode.find({ ownerUserId: userId })
      .populate("matrixParentId", "nodeCode")
      .populate("directChildren", "nodeCode")
      .populate("rebirthId", "displayCode")
      .sort({ createdAt: 1 });

    const rebirths = await RebirthId.find({ ownerUserId: userId }).sort({
      levelNumber: 1,
      levelSequence: 1,
    });

    return {
      user,
      nodes,
      rebirths,
    };
  },

  /**
   * Get individual users paginated and summarized list for admin autopool panel
   */
  getIndividualAutopoolSummary: async (options = {}) => {
    const { search = "", status = "", level = "", round = "", page = 1, limit = 10, accountType = "all" } = options;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;
    const targetLevel = level !== "" ? level : round;

    const userFilter = {};
    if (search) {
      userFilter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { memberId: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (accountType === "alias") {
      userFilter.isAliasAccount = true;
    } else if (accountType === "real") {
      userFilter.isAliasAccount = { $ne: true };
    }

    const allUsers = await User.find(userFilter)
      .select("memberId fullName email sponsorId phone createdAt isAliasAccount aliasOfUserId aliasOfAccountId rootOwnerUserId rootOwnerAccountId createdFromAutopoolLevel")
      .lean();

    const results = [];
    for (const user of allUsers) {
      const nodes = await AutoPoolNode.find({ ownerUserId: user._id })
        .select("levelNumber status")
        .lean();

      let latestCompletedLevel = -1;
      let currentLevel = 0;
      const hasAnyRebirth = nodes.length > 0;

      for (let r = 0; r <= 9; r++) {
        const required = Math.pow(2, r + 1);
        const roundNodes = nodes.filter((n) => n.levelNumber === r);
        const completedCount = roundNodes.filter((n) => n.status === "COMPLETED").length;
        const isCompleted = roundNodes.length === required && completedCount === required;

        if (isCompleted) {
          latestCompletedLevel = r;
        }
      }

      for (let r = 0; r <= 9; r++) {
        const required = Math.pow(2, r + 1);
        const roundNodes = nodes.filter((n) => n.levelNumber === r);
        const completedCount = roundNodes.filter((n) => n.status === "COMPLETED").length;
        const isCompleted = roundNodes.length === required && completedCount === required;
        if (!isCompleted) {
          currentLevel = r;
          break;
        }
        if (r === 9 && isCompleted) {
          currentLevel = 9;
        }
      }

      let userStatus = "Pending";
      if (latestCompletedLevel === 9) {
        userStatus = "Completed";
      } else if (hasAnyRebirth) {
        userStatus = "In Progress";
      }

      results.push({
        userId: user._id,
        memberId: user.memberId,
        fullName: user.fullName,
        email: user.email,
        sponsorId: user.sponsorId || "N/A",
        phone: user.phone || "N/A",
        totalRebirths: nodes.length,
        completedRebirthsCount: nodes.filter((n) => n.status === "COMPLETED").length,
        pendingRebirthsCount: nodes.filter((n) => n.status !== "COMPLETED").length,
        currentLevel,
        latestCompletedLevel: latestCompletedLevel === -1 ? null : latestCompletedLevel,
        status: userStatus,
        isAliasAccount: user.isAliasAccount || false,
        aliasOfUserId: user.aliasOfUserId || null,
        aliasOfAccountId: user.aliasOfAccountId || null,
        rootOwnerUserId: user.rootOwnerUserId || null,
        rootOwnerAccountId: user.rootOwnerAccountId || null,
        createdFromAutopoolLevel: user.createdFromAutopoolLevel ?? null,
      });
    }

    // Apply in-memory filters
    let filteredResults = results;
    if (status) {
      filteredResults = filteredResults.filter(
        (u) => u.status.toLowerCase() === status.toLowerCase()
      );
    }
    if (targetLevel !== undefined && targetLevel !== null && targetLevel !== "") {
      const levelNum = parseInt(targetLevel);
      filteredResults = filteredResults.filter((u) => u.currentLevel === levelNum);
    }

    const total = filteredResults.length;
    const paginated = filteredResults.slice(skip, skip + limitNum);

    return {
      users: paginated,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  },

  /**
   * Get complete details of one user's individual autopool progress
   */
  getIndividualAutopoolDetails: async (userId) => {
    const { WalletModel } = await import("../user/wallet.model.js");

    const user = await User.findById(userId).lean();
    if (!user) throw new Error("User not found");

    const wallet = await WalletModel.findOne({ userRef: userId }).lean();
    const allUserNodes = await AutoPoolNode.find({ ownerUserId: userId })
      .populate("matrixParentId", "nodeCode")
      .lean();

    // Map children nodes for rendering child codes
    const allChildrenIds = allUserNodes.reduce((acc, n) => {
      if (n.directChildren) {
        acc.push(...n.directChildren.map((c) => c.toString()));
      }
      return acc;
    }, []);

    const childrenNodes = await AutoPoolNode.find({ _id: { $in: allChildrenIds } })
      .select("nodeCode displayCode status directChildrenCount")
      .lean();

    const childrenMap = new Map(childrenNodes.map((c) => [c._id.toString(), c]));

    // Get rebirth nodes generated FROM user's completed nodes
    const allNodeIds = allUserNodes.map((n) => n._id);
    const generatedRebirths = await AutoPoolNode.find({
      generatedFromNodeId: { $in: allNodeIds },
    })
      .select("nodeCode displayCode generatedFromNodeId")
      .lean();

    const generatedMap = new Map();
    generatedRebirths.forEach((gr) => {
      const fromId = gr.generatedFromNodeId.toString();
      if (!generatedMap.has(fromId)) generatedMap.set(fromId, []);
      generatedMap.get(fromId).push(gr.nodeCode || gr.displayCode);
    });

    const levelWiseStatus = [];
    let latestCompletedLevel = -1;
    let currentActiveLevel = 0;

    for (let r = 0; r <= 9; r++) {
      const required = Math.pow(2, r + 1);
      const roundNodes = allUserNodes.filter((n) => n.levelNumber === r);
      const completedCount = roundNodes.filter((n) => n.status === "COMPLETED").length;
      const generatedCount = roundNodes.length;

      let status = "Pending";
      if (generatedCount === required && completedCount === required) {
        status = "Completed";
        latestCompletedLevel = r;
      } else if (generatedCount > 0 || completedCount > 0) {
        status = "In Progress";
      }

      let completionDate = null;
      if (status === "Completed") {
        const completedTimes = roundNodes
          .map((n) => n.completedAt)
          .filter((t) => t)
          .map((t) => new Date(t).getTime());
        if (completedTimes.length > 0) {
          completionDate = new Date(Math.max(...completedTimes));
        }
      }

      const rebirths = roundNodes.map((n) => {
        const directChildrenList = (n.directChildren || []).map((cId) => {
          const cNode = childrenMap.get(cId.toString());
          return cNode ? cNode.nodeCode || cNode.displayCode : cId.toString();
        });

        return {
          _id: n._id,
          rebirthCode: n.nodeCode || n.displayCode,
          level: n.levelNumber,
          sequence: n.levelSequence,
          parentCode: n.matrixParentId?.nodeCode || "None",
          childrenCount: n.directChildrenCount || 0,
          childCodes: directChildrenList,
          newRebirthCodes: generatedMap.get(n._id.toString()) || [],
          status:
            n.status === "COMPLETED"
              ? "Completed"
              : n.status === "PLACED"
              ? "Active"
              : "In Queue",
          completedAt: n.completedAt,
        };
      });

      levelWiseStatus.push({
        level: r,
        requiredCount: required,
        generatedCount,
        completedCount,
        pendingCount: required - completedCount,
        status,
        completionDate,
        rebirths,
      });
    }

    for (let r = 0; r <= 9; r++) {
      if (levelWiseStatus[r].status !== "Completed") {
        currentActiveLevel = r;
        break;
      }
      if (r === 9 && levelWiseStatus[r].status === "Completed") {
        currentActiveLevel = 9;
      }
    }

    const totalRebirths = allUserNodes.length;
    const totalCompletedRebirths = allUserNodes.filter(
      (n) => n.status === "COMPLETED"
    ).length;
    const totalPendingRebirths = totalRebirths - totalCompletedRebirths;

    const rebirthDetails = [];
    levelWiseStatus.forEach((lws) => {
      rebirthDetails.push(...lws.rebirths);
    });

    return {
      userSummary: {
        userId: user._id,
        memberId: user.memberId,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone || "N/A",
        sponsorId: user.sponsorId || "N/A",
        totalRebirthsCreated: totalRebirths,
        currentActiveLevel,
        totalCompletedRebirths,
        totalPendingRebirths,
        latestCompletedLevel: latestCompletedLevel === -1 ? null : latestCompletedLevel,
        withdrawableWalletAmount: wallet?.withdrawableFund || 0,
        poolFundAmount: wallet?.fundWallet || 0,
      },
      levelWiseStatus,
      rebirthDetails,
    };
  },

  /**
   * Get user's isolated individual tree structure
   */
  getIndividualAutopoolTree: async (userId) => {
    const user = await User.findById(userId).lean();
    if (!user) throw new Error("User not found");

    const nodes = await AutoPoolNode.find({ ownerUserId: userId })
      .populate("matrixParentId", "nodeCode ownerUserId")
      .lean();

    const userNodeIds = new Set(nodes.map((n) => n._id.toString()));

    const mappedNodes = nodes.map((node) => {
      const hasParentInTree =
        node.matrixParentId && userNodeIds.has(node.matrixParentId._id.toString());

      return {
        ...node,
        poolNodeId: node.nodeCode,
        parentPoolNodeId: hasParentInTree
          ? {
              ...node.matrixParentId,
              poolNodeId: node.matrixParentId.nodeCode,
            }
          : null,
        linkedRebirthNodeId: {
          rebirthId: node.nodeCode,
          ownerUserId: {
            _id: user._id,
            fullName: user.fullName,
            memberId: user.memberId,
          },
          ownerName: user.fullName,
          memberId: user.memberId,
          level: node.levelNumber ?? 0,
          sequence: node.levelSequence ?? 0,
        },
        autopoolChildrenCount: node.directChildrenCount || 0,
      };
    });

    return mappedNodes;
  },
};

export default autopool3x3Service;
