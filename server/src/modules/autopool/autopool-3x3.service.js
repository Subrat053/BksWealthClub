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
function generateRebirthCode({ memberIdOrCode, parentRebirthCode, generation, sequence }) {
  // For initial rebirths (generation 0)
  if (!parentRebirthCode) {
    return `${memberIdOrCode}-R${sequence}`;
  }

  // For rebirths from completed nodes
  if (generation === 1) {
    return `${parentRebirthCode}-X${sequence}`;
  }

  // For deeper generations
  return `${parentRebirthCode}-A${sequence}`;
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
      if (deposit.rebirthProcessed && deposit.autoPoolProcessed) {
        console.log(`[AutoPool] Deposit ${deposit._id} already processed, skipping`);
        return {
          skipped: true,
          message: "Deposit already processed",
        };
      }

      // Fetch user
      const user = await User.findById(deposit.userRef).session(s);
      if (!user) throw new Error(`User ${deposit.userRef} not found`);

      // Ensure root exists before processing any deposit
      await ensureAutoPoolRoot(s);

      // Check if rebirths already exist for this user and deposit (Source Type: INITIAL)
      const existingRebirths = await RebirthId.find({
        ownerUserId: user._id,
        depositId: deposit._id,
        sourceType: "INITIAL"
      }).session(s);

      let rebirths;
      let rebirthNodes = [];

      if (existingRebirths.length === 2) {
        // Rebirths already created, use them
        rebirths = existingRebirths;
        console.log(`[AutoPool] Rebirths already exist for ${user.memberId} (Deposit: ${deposit._id}), reusing`);
      } else if (existingRebirths.length === 0) {
        // Create exactly 2 initial rebirths
        rebirths = await autopool3x3Service.createInitialRebirthsForUser(
          user._id,
          deposit._id,
          user.memberId,
          s,
        );
      } else {
        // Partial state
        throw new Error(
          `Inconsistent rebirth state: found ${existingRebirths.length} initial rebirths for ${user.memberId}`,
        );
      }

      // 5. Create main user AutoPool node (MAIN node)
      const mainNode = await autopool3x3Service.createAutoPoolNodeForMainUser(
        user._id,
        deposit._id,
        user.memberId,
        s,
      );

      // 6. Create rebirth AutoPool nodes (REBIRTH nodes)
      for (const rebirth of rebirths) {
        const rebirthNode = await autopool3x3Service.createAutoPoolNodeForRebirth(
          rebirth._id,
          s,
        );
        rebirthNodes.push(rebirthNode);
      }

      // 7. Enqueue all nodes
      await autopool3x3Service.enqueueAutoPoolNode(mainNode._id, s);
      for (const node of rebirthNodes) {
        await autopool3x3Service.enqueueAutoPoolNode(node._id, s);
      }

      // Mark deposit processed
      deposit.rebirthProcessed = true;
      deposit.autoPoolProcessed = true;
      
      if (!(depositIdOrDoc && typeof depositIdOrDoc === 'object' && depositIdOrDoc._id)) {
        await deposit.save({ session: s });
      }

      return {
        depositId: deposit._id,
        userId: user._id,
        mainNodeId: mainNode._id,
        rebirthNodeIds: rebirthNodes.map((n) => n._id),
        rebirthIds: rebirths.map((r) => r.rebirthCode),
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
      // 1. Create initial rebirths
      const rebirths = await autopool3x3Service.createInitialRebirthsForUser(
        userId,
        null, // No deposit
        memberId,
        s,
      );

      // 2. Create main user AutoPool node
      const mainNode = await autopool3x3Service.createAutoPoolNodeForMainUser(
        userId,
        null, // No deposit
        memberId,
        s,
      );

      // 3. Create rebirth AutoPool nodes
      const rebirthNodes = [];
      for (const rebirth of rebirths) {
        const rebirthNode = await autopool3x3Service.createAutoPoolNodeForRebirth(
          rebirth._id,
          s,
        );
        rebirthNodes.push(rebirthNode);
      }

      // 4. Enqueue all nodes
      await autopool3x3Service.enqueueAutoPoolNode(mainNode._id, s);
      for (const node of rebirthNodes) {
        await autopool3x3Service.enqueueAutoPoolNode(node._id, s);
      }

      console.log(`[AutoPool] Manually activated ${memberId} in 3x3 AutoPool`);

      return {
        userId,
        memberId,
        mainNodeId: mainNode._id,
        rebirthNodeIds: rebirthNodes.map((n) => n._id),
        rebirthCodes: rebirths.map((r) => r.rebirthCode),
      };
    };

    return session ? fn(session) : withTransactionRetry(fn);
  },

  /**
   * Create 2 initial rebirth IDs for a user on their first deposit
   */
  createInitialRebirthsForUser: async (userId, depositId, memberId, session = null) => {
    const fn = async (s) => {
      const rebirths = [];

      for (let i = 1; i <= 2; i++) {
        const rebirthCode = generateRebirthCode({
          memberIdOrCode: memberId,
          parentRebirthCode: null,
          generation: 0,
          sequence: i,
        });

        // Check for duplicate
        const existing = await RebirthId.findOne({
          rebirthCode,
        }).session(s);

        if (existing) {
          rebirths.push(existing);
          continue;
        }

        // Create rebirth
        const rebirth = await RebirthId.create(
          [
            {
              ownerUserId: userId,
              depositId,
              rebirthCode,
              sequenceNumber: i,
              generation: 0,
              sourceType: "INITIAL",
              isInitialRebirth: true,
              status: "ACTIVE",
            },
          ],
          { session: s },
        );

        rebirths.push(rebirth[0]);
      }

      return rebirths;
    };

    return session ? fn(session) : withTransactionRetry(fn);
  },

  /**
   * Create AutoPool node for main user
   */
  createAutoPoolNodeForMainUser: async (userId, depositId, memberId, session = null) => {
    const fn = async (s) => {
      // Check for duplicate by userId/type OR by nodeCode (unique index)
      const existing = await AutoPoolNode.findOne({
        $or: [
          { userId, nodeType: "MAIN", depositId },
          { nodeCode: memberId }
        ]
      }).session(s);

      if (existing) {
        console.log(`[AutoPool] Node with code ${memberId} already exists, reusing`);
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
    // 1. Try to find the ROOT node if it has space
    const rootParent = await AutoPoolNode.findOne({
      nodeType: "ROOT",
      status: "PLACED",
      directChildrenCount: { $lt: 3 },
    }).session(session);

    if (rootParent) return rootParent;

    // 2. Otherwise find oldest placed node (ROOT or REBIRTH or MAIN) with capacity
    return await AutoPoolNode.findOne({
      status: "PLACED",
      directChildrenCount: { $lt: 3 },
    })
      .sort({ queueTimestamp: 1 }) // FIFO order by when they entered the pool
      .session(session);
  },

  processAutoPoolQueue: async (session = null) => {
    const fn = async (s) => {
      const MAX_PROCESS_PER_RUN = 100;
      let placedCount = 0;

      // Ensure root exists
      await ensureAutoPoolRoot(s);

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

      // Guard: already completed?
      if (node.status === "COMPLETED") {
        console.log(`[AutoPool] Node ${node.nodeCode} already completed`);
        return node;
      }

      // Guard: has 3 children?
      if (node.directChildrenCount !== 3) {
        console.log(
          `[AutoPool] Node ${node.nodeCode} has only ${node.directChildrenCount} children, not completing`,
        );
        return node;
      }

      // Mark as completed
      node.status = "COMPLETED";
      node.completedAt = new Date();
      await node.save({ session: s });

      console.log(`[AutoPool] Completed node: ${node.nodeCode}`);

      // ─── REGENERATION LOGIC ───
      // Rule: If the node is a "deposited money" account (MAIN or ROOT), no rebirth is generated.
      // If it's a "rebirth" account (REBIRTH), it generates 2 new rebirths.
      if (node.nodeType === "REBIRTH") {
        console.log(`[AutoPool] REBIRTH node ${node.nodeCode} completed. Generating next cycle rebirths.`);
        const newRebirths = await autopool3x3Service.generateNextRebirthsFromCompletedNode(
          node._id,
          s,
        );

        // Create and enqueue rebirth nodes
        for (const rebirth of newRebirths) {
          const rebirthNode = await autopool3x3Service.createAutoPoolNodeForRebirth(
            rebirth._id,
            s,
          );
          await autopool3x3Service.enqueueAutoPoolNode(rebirthNode._id, s);
        }
        
        node.rebirthGenerated = true;
        node.rebirthGeneratedAt = new Date();
      } else {
        console.log(`[AutoPool] ${node.nodeType} node ${node.nodeCode} (Deposited Money Account) completed. No additional rebirths generated.`);
        node.rebirthGenerated = false;
      }

      await node.save({ session: s });
      return node;
    };

    return session ? fn(session) : withTransactionRetry(fn);
  },

  /**
   * Generate 2 new rebirth IDs from a completed node
   */
  generateNextRebirthsFromCompletedNode: async (completedNodeId, session = null) => {
    const fn = async (s) => {
      const node = await AutoPoolNode.findById(completedNodeId).session(s);
      if (!node) throw new Error(`Node ${completedNodeId} not found`);

      const user = await User.findById(node.ownerUserId).session(s);
      if (!user) throw new Error(`User ${node.ownerUserId} not found`);

      const newRebirths = [];

      // Determine rebirth code generation
      let parentCode = node.nodeCode;
      let generation = 1; // First generation of new rebirths

      // If this node is already a rebirth, increment generation
      if (node.nodeType === "REBIRTH") {
        const rebirth = await RebirthId.findById(node.rebirthId).session(s);
        if (rebirth) {
          generation = rebirth.generation + 1;
        }
      }

      for (let i = 1; i <= 2; i++) {
        const rebirthCode = generateRebirthCode({
          memberIdOrCode: null,
          parentRebirthCode: parentCode,
          generation,
          sequence: i,
        });

        // Check for duplicate
        const existing = await RebirthId.findOne({
          rebirthCode,
        }).session(s);

        if (existing) {
          newRebirths.push(existing);
          continue;
        }

        // Create rebirth
        const rebirth = await RebirthId.create(
          [
            {
              ownerUserId: node.ownerUserId,
              rebirthCode,
              sequenceNumber: i,
              generation,
              sourceType: "AUTOPool_COMPLETION",
              parentRebirthId: node.rebirthId || null,
              generatedFromNodeId: node._id,
              isInitialRebirth: false,
              status: "ACTIVE",
            },
          ],
          { session: s },
        );

        newRebirths.push(rebirth[0]);
      }

      return newRebirths;
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
