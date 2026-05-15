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
import { DepositModel } from "../deposit/deposit.model.js";
import { User } from "../user/user.model.js";
import { AutoPoolLevelCompletion } from "./autopool-level-completion.model.js";

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 100;

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
        err?.errorResponse?.errorLabels?.includes("TransientTransactionError") ||
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
    generateRebirthCode({ memberId, level: 0, sequence: 2 })
  ];
}

// ─── Root Management ────────────────────────────────────────────────────────────

/**
 * Ensure the Operational Admin exists in the User collection
 */
async function ensureOperationalAdmin(session = null) {
  const memberId = "BKS000000";
  const email = "operational@bkswealthclub.local";
  
  let user = await User.findOne({ memberId }).session(session);
  if (!user) {
    // If not found, it should be created by seed script, but we handle it here just in case
    console.warn(`[AutoPool] Operational Admin ${memberId} not found. Ensure seeding is complete.`);
  }
  return user;
}

/**
 * Ensure the AutoPool Root node exists for Operational Admin
 */
async function ensureAutoPoolRoot(session = null) {
  const memberId = "BKS000000";
  const user = await ensureOperationalAdmin(session);
  if (!user) return null;

  // Find by nodeCode regardless of nodeType to prevent duplicate key error
  let rootNode = await AutoPoolNode.findOne({ 
    nodeCode: memberId
  }).session(session);

  if (!rootNode) {
    console.log(`[AutoPool] Creating AutoPool Root for ${memberId}`);
    const results = await AutoPoolNode.create([{
      ownerUserId: user._id,
      nodeCode: memberId,
      nodeId: memberId,
      nodeType: "ROOT",
      userId: user._id,
      status: "PLACED", // Root is always placed
      isRoot: true,
      isOperationalRoot: true,
      queueTimestamp: new Date("2000-01-01T00:00:00Z"),
    }], { session });
    
    rootNode = Array.isArray(results) ? results[0] : results;
  } else {
    // If it exists but has wrong type or status, fix it
    if (rootNode.nodeType !== "ROOT" || rootNode.status !== "PLACED" || !rootNode.isRoot) {
      console.log(`[AutoPool] Updating existing node ${memberId} to ROOT status`);
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
      await AutoPoolNode.create([{
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
      }], { session });
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
      if (depositIdOrDoc && typeof depositIdOrDoc === 'object' && depositIdOrDoc._id) {
        deposit = depositIdOrDoc;
      } else {
        deposit = await DepositModel.findById(depositIdOrDoc).session(s);
      }
      
      if (!deposit) throw new Error(`Deposit ${depositIdOrDoc} not found`);

      // Guard: already processed?
      if (deposit.autoPoolProcessed) {
        console.log(`[AutoPool] Deposit ${deposit._id} already processed, skipping`);
        return { skipped: true, message: "Already processed" };
      }

      // Fetch user
      const user = await User.findById(deposit.userRef).session(s);
      if (!user) throw new Error(`User ${deposit.userRef} not found`);

      // 1. Activate user (if not already)
      if (user.status !== 'active') {
        user.status = 'active';
        user.isActive = true;
        user.isActivated = true;
        user.activationStatus = 'ACTIVE';
        user.activatedAt = new Date();
        await user.save({ session: s });
      }

      // Ensure root exists
      await ensureAutoPoolRoot(s);

      // 2. Generate initial rebirth nodes (MEMBERID-0.1, MEMBERID-0.2)
      const rebirthNodes = await autopool3x3Service.createInitialRebirthsForUser(
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
      const rebirthNodes = await autopool3x3Service.createInitialRebirthsForUser(
        userId,
        null, // No deposit
        memberId,
        s,
      );

      // 2. Enqueue only rebirth nodes
      for (const node of rebirthNodes) {
        await autopool3x3Service.enqueueAutoPoolNode(node._id, s);
      }

      console.log(`[AutoPool] Manually activated ${memberId} in 3x3 AutoPool with rebirth nodes`);

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
  createInitialRebirthsForUser: async (userId, depositId, memberId, session = null) => {
    const fn = async (s) => {
      const rebirthNodes = [];

      for (let i = 1; i <= 2; i++) {
        const displayCode = generateRebirthCode({
          memberId: memberId,
          level: 0,
          sequence: i,
        });

        // Atomic check/create to prevent duplicates
        let node = await AutoPoolNode.findOne({ displayCode }).session(s);
        if (!node) {
          const results = await AutoPoolNode.create([{
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
          }], { session: s });
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
  createAutoPoolNodeForMainUser: async (userId, depositId, memberId, session = null) => {
    const fn = async (s) => {
      // Check for duplicate
      const existing = await AutoPoolNode.findOne({
        userId,
        nodeType: "MAIN",
        depositId,
      }).session(s);

      if (existing) {
        console.log(`[AutoPool] Main node already exists for ${memberId}, reusing`);
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
        console.log(`[AutoPool] Rebirth node already exists for ${rebirth.rebirthCode}, reusing`);
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
            generatedFromNodeId: rebirth.generatedFromNodeId || rebirth.generatedFromPoolNodeId,
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
        console.log(`[AutoPool] Node ${node.nodeCode} not in PENDING state, skipping enqueue`);
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
      nodeType: "REBIRTH"
    })
      .sort({ queueTimestamp: 1 })
      .session(session);
  },

  processAutoPoolQueue: async (session = null) => {
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
        const availableParent = await autopool3x3Service.findNextAvailableParent(s);

        if (!availableParent) {
          // If no available parent, and this is the admin root node itself (shouldn't happen if ensureAutoPoolRoot ran)
          if (pendingNode.nodeCode === "BKS000000") {
             pendingNode.status = "PLACED";
             pendingNode.matrixParentId = null;
             pendingNode.parentNodeId = null;
             pendingNode.isRoot = true;
             await pendingNode.save({ session: s });
             placedCount++;
             continue;
          }
          console.warn(`[AutoPool] No available parent found for ${pendingNode.nodeCode}. Matrix might be corrupted or root missing.`);
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
          // Parent was updated by another process, retry
          console.warn(`[AutoPool] Parent ${availableParent.nodeCode} updated by concurrent process`);
          continue;
        }

        // 4. Update child
        pendingNode.status = "PLACED";
        pendingNode.matrixParentId = availableParent._id;
        pendingNode.parentNodeId = availableParent._id;
        await pendingNode.save({ session: s });

        placedCount += 1;
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

    return session ? fn(session) : withTransactionRetry(fn);
  },

  /**
   * Complete an AutoPool node
   * 1. Mark as completed
   * 2. Check if rebirths already generated
   * 3. Generate new rebirth IDs
   * 4. Create rebirth nodes
   * 5. Enqueue rebirth nodes
   */
  completeAutoPoolNode: async (nodeId, session = null) => {
    const fn = async (s) => {
      const node = await AutoPoolNode.findById(nodeId).session(s);
      if (!node) throw new Error(`Node ${nodeId} not found`);

      if (node.status === "COMPLETED") return node;

      // Mark as completed
      node.status = "COMPLETED";
      node.completedAt = new Date();
      await node.save({ session: s });

      console.log(`[AutoPool] Completed node: ${node.nodeCode}`);

      // Generate next-round rebirth IDs
      if (node.nodeType === "REBIRTH" && !node.rebirthGenerated) {
        await autopool3x3Service.generateNextLevelRebirthsFromCompletedNode(node._id, s);
        node.rebirthGenerated = true;
        node.rebirthGeneratedAt = new Date();
        await node.save({ session: s });
      }

      // Check User Level Completion
      await autopool3x3Service.checkUserAutoPoolLevelCompletion(node.ownerUserId, node.levelNumber, s);

      return node;
    };

    return session ? fn(session) : withTransactionRetry(fn);
  },

  /**
   * Generate 2 new rebirth IDs from a completed node
   */
  generateNextLevelRebirthsFromCompletedNode: async (completedNodeId, session = null) => {
    const fn = async (s) => {
      const node = await AutoPoolNode.findById(completedNodeId).session(s);
      if (!node) return;

      const nextLevel = node.levelNumber + 1;
      const memberId = node.ownerMemberId;

      // Find current max sequence for this user at the next level to maintain GLOBAL SEQUENCE per round
      const lastNodeAtNextLevel = await AutoPoolNode.findOne({
        ownerUserId: node.ownerUserId,
        levelNumber: nextLevel
      }).sort({ levelSequence: -1 }).session(s);

      let startSequence = lastNodeAtNextLevel ? lastNodeAtNextLevel.levelSequence + 1 : 1;

      for (let i = 0; i < 2; i++) {
        const sequence = startSequence + i;
        const displayCode = generateRebirthCode({ memberId, level: nextLevel, sequence });

        let newNode = await AutoPoolNode.findOne({ displayCode }).session(s);
        if (!newNode) {
          const results = await AutoPoolNode.create([{
            ownerUserId: node.ownerUserId,
            ownerMemberId: memberId,
            nodeCode: displayCode,
            displayCode: displayCode,
            nodeId: displayCode,
            nodeType: "REBIRTH",
            levelNumber: nextLevel,
            levelSequence: sequence,
            generatedFromNodeId: node._id,
            status: "PENDING",
            queueTimestamp: new Date(),
          }], { session: s });
          newNode = results[0];
        }
        
        await autopool3x3Service.enqueueAutoPoolNode(newNode._id, s);
      }
    };

    return session ? fn(session) : withTransactionRetry(fn);
  },

  /**
   * Check User Level Completion
   * Level completes when expectedNodeCount (2^(level+1)) nodes are COMPLETED
   */
  checkUserAutoPoolLevelCompletion: async (ownerUserId, levelNumber, session = null) => {
    const fn = async (s) => {
      const user = await User.findById(ownerUserId).session(s);
      if (!user) return;

      const expectedNodeCount = Math.pow(2, levelNumber + 1);
      const completedNodeCount = await AutoPoolNode.countDocuments({
        ownerUserId,
        levelNumber,
        status: "COMPLETED"
      }).session(s);

      if (completedNodeCount >= expectedNodeCount) {
        // Prevent duplicate completion
        const existing = await AutoPoolLevelCompletion.findOne({
          ownerUserId,
          levelNumber
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
              completedAt: new Date()
            },
            { upsert: true, session: s }
          );
          console.log(`[AutoPool] User ${user.memberId} completed Level ${levelNumber} (AutoPool ${levelNumber + 1})`);
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
            isCompleted: false
          },
          { upsert: true, session: s }
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
      .sort({ createdAt: 1 });

    return nodes;
  },

  /**
   * Get user's rebirth IDs
   */
  getUserRebirths: async (userId) => {
    const rebirths = await RebirthId.find({ ownerUserId: userId }).sort({
      generation: 1,
      sequenceNumber: 1,
    });

    return rebirths;
  },

  /**
   * Get AutoPool tree (admin)
   */
  getAutoPoolTree: async (limit = 100) => {
    const nodes = await AutoPoolNode.find()
      .populate("ownerUserId", "memberId email")
      .populate("matrixParentId", "nodeCode")
      .populate("userId", "memberId")
      .populate("rebirthId", "rebirthCode")
      .sort({ queueTimestamp: 1 })
      .limit(limit);

    return nodes;
  },

  /**
   * Get AutoPool queue status
   */
  getQueueStatus: async () => {
    const pending = await AutoPoolNode.countDocuments({ status: "PENDING" });
    const placed = await AutoPoolNode.countDocuments({ status: "PLACED" });
    const completed = await AutoPoolNode.countDocuments({ status: "COMPLETED" });

    return {
      pending,
      placed,
      completed,
      total: pending + placed + completed,
    };
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
      .sort({ createdAt: 1 });

    const rebirths = await RebirthId.find({ ownerUserId: userId }).sort({
      generation: 1,
      sequenceNumber: 1,
    });

    return {
      user,
      nodes,
      rebirths,
    };
  },
};

export default autopool3x3Service;
