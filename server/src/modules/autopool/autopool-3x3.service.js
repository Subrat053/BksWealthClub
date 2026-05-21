/**
 * AutoPool 3x3 Matrix Service
 *
 * Implements 3x3 Matrix AutoPool with Rebirth IDs.
 * Features:
 * - FIFO queue placement
 * - Node completion on 3 direct children
            queueIndex: 0,
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
import { AutopoolQueueCounter } from "./autopool-queue-counter.model.js";
import { env } from "../../config/env.js";
import { autopoolFundService } from "./autopool-fund.service.js";
import {
  calculateAutopoolFundSummary,
  UPGRADE_ID_COST,
} from "./autopool-fund-new.service.js";
import { AutopoolFundTransaction } from "./autopool-fund-transaction.model.js";
import { isAutopoolRepairLocked } from "./autopool-repair-lock.service.js";
import { AutopoolUserFund } from "./autopool-user-fund.model.js";


export async function getNextQueueSerialNo(session = null) {
  const counter = await AutopoolQueueCounter.findOneAndUpdate(
    { key: "GLOBAL_AUTOPOOL_QUEUE" },
    { $inc: { currentSerialNo: 1 } },
    { upsert: true, new: true, session }
  );
  return counter.currentSerialNo;
}

export async function getNextPlacementSerialNo(session = null) {
  const counter = await AutopoolQueueCounter.findOneAndUpdate(
    { key: "GLOBAL_AUTOPOOL_PLACEMENT" },
    { $inc: { currentSerialNo: 1 } },
    { upsert: true, new: true, session }
  );
  return counter.currentSerialNo;
}

const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 150;
let isProcessing3x3Queue = false;

const escapeRegExp = (value = "") =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function getCompletedLevelFromCompletedRebirths(completedCount) {
  const count = Number(completedCount) || 0;
  if (count < 2) return null;
  if (count < 6) return 0;
  if (count < 14) return 1;
  if (count < 30) return 2;
  if (count < 62) return 3;
  if (count < 126) return 4;
  if (count < 254) return 5;
  if (count < 510) return 6;
  if (count < 1022) return 7;
  if (count < 2046) return 8;
  return 9;
}

export function getCurrentActiveLevelFromCompletedRebirths(completedCount) {
  const completedLevel = getCompletedLevelFromCompletedRebirths(completedCount);
  return completedLevel === null ? 0 : Math.min(9, completedLevel + 1);
}

const isNodeCompletedForReport = (node = {}) =>
  node.status === "COMPLETED" ||
  node.isCompleted === true ||
  Boolean(node.completedAt) ||
  Number(node.directChildrenCount || 0) >= 3;

const getNodeDisplayStatus = (node = {}) => {
  if (isNodeCompletedForReport(node)) return "COMPLETED";
  if (node.status === "PLACED") return "PLACED";
  return "PENDING";
};


const getResolvedCompletedAutopoolLevel = (latestCompletedLevel, fundRecord) => {
  if (Number.isFinite(latestCompletedLevel) && latestCompletedLevel >= 0) {
    return latestCompletedLevel;
  }

  const storedRound = Number(fundRecord?.lastCompletedRound);
  if (Number.isFinite(storedRound) && storedRound >= 0) {
    return storedRound;
  }

  const storedLevel = Number(fundRecord?.completedAutopoolLevel);
  if (Number.isFinite(storedLevel) && storedLevel > 0) {
    return storedLevel;
  }

  return null;
};

const getCompletedLevelFromCompletedCount = (completedCount) =>
  getCompletedLevelFromCompletedRebirths(completedCount);

const getCurrentActiveLevelFromCompletedCount = (completedCount) =>
  getCurrentActiveLevelFromCompletedRebirths(completedCount);

async function reconcileAutopoolFundSummary({
  userId,
  completedLevel,
  fundRecord = null,
  session = null,
}) {
  const calculatedSummary = calculateAutopoolFundSummary(completedLevel);
  let currentFund = fundRecord;

  if (completedLevel === null) {
    return {
      fundRecord: currentFund,
      summary: calculatedSummary,
    };
  }

  if (!currentFund) {
    currentFund = await AutopoolUserFund.findOne({ userId }).session(session);
    if (!currentFund) {
      currentFund = new AutopoolUserFund({ userId });
    }
  } else if (typeof currentFund.save !== "function") {
    currentFund = AutopoolUserFund.hydrate(currentFund);
  }

  const currentValues = {
    completedAutopoolLevel: Number(currentFund.completedAutopoolLevel || 0),
    poolFundTotal: Number(currentFund.poolFundTotal || 0),
    reinvestmentFundTotal: Number(currentFund.reinvestmentFundTotal || 0),
    withdrawableAutopoolFund: Number(currentFund.withdrawableAutopoolFund || 0),
    upgradeIdCount: Number(currentFund.upgradeIdCount || 0),
    upgradeDeductionTotal: Number(currentFund.upgradeDeductionTotal || 0),
  };

  const summaryValues = {
    completedAutopoolLevel: Number(calculatedSummary.completedAutopoolLevel || 0),
    poolFundTotal: Number(calculatedSummary.poolFundTotal || 0),
    reinvestmentFundTotal: Number(calculatedSummary.reinvestmentFundTotal || 0),
    withdrawableAutopoolFund: Number(calculatedSummary.withdrawableAutopoolFund || 0),
    upgradeIdCount: Number(calculatedSummary.upgradeIdCount || 0),
    upgradeDeductionTotal: Number(calculatedSummary.upgradeDeductionTotal || 0),
  };

  const needsSync = Object.keys(summaryValues).some(
    (key) => currentValues[key] !== summaryValues[key],
  );

  if (needsSync) {
    currentFund.completedAutopoolLevel = summaryValues.completedAutopoolLevel;
    currentFund.poolFundTotal = summaryValues.poolFundTotal;
    currentFund.reinvestmentFundTotal = summaryValues.reinvestmentFundTotal;
    currentFund.withdrawableAutopoolFund = summaryValues.withdrawableAutopoolFund;
    currentFund.upgradeIdCount = summaryValues.upgradeIdCount;
    currentFund.upgradeDeductionTotal = summaryValues.upgradeDeductionTotal;
    currentFund.lastCompletedRound = summaryValues.completedAutopoolLevel;
    await currentFund.save({ session });
  }

  return {
    fundRecord: currentFund,
    summary: calculatedSummary,
  };
}

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
  const memberId = "BKS000000";
  const rootCode = "BKS000000-0.1";
  const user = await User.findOne({ memberId }).session(session);
  if (!user) {
    console.warn(`[AutoPool] Admin user BKS000000 not found for root initialization.`);
    return null;
  }

  // Deactivate any legacy BKS000000 main admin node if it exists as an active tree node
  await AutoPoolNode.updateMany(
    { nodeCode: memberId },
    { $set: { isActiveInAutopool: false, repairStatus: "ORPHANED" } },
    { session }
  );

  // Initialize AutopoolQueueCounters for GLOBAL_AUTOPOOL_QUEUE & GLOBAL_AUTOPOOL_PLACEMENT if not exists
  await AutopoolQueueCounter.findOneAndUpdate(
    { key: "GLOBAL_AUTOPOOL_QUEUE" },
    { $setOnInsert: { currentSerialNo: 1 } },
    { upsert: true, session }
  );
  
  await AutopoolQueueCounter.findOneAndUpdate(
    { key: "GLOBAL_AUTOPOOL_PLACEMENT" },
    { $setOnInsert: { currentSerialNo: 1 } },
    { upsert: true, session }
  );

  // Find root node by nodeCode "BKS000000-0.1"
  let rootNode = await AutoPoolNode.findOne({ nodeCode: rootCode }).session(session);
  if (!rootNode) {
    console.log(`[AutoPool] Creating AutoPool Root: ${rootCode}`);
    
    // Ensure RebirthId exists for BKS000000-0.1
    let rebirthDoc = await RebirthId.findOne({ displayCode: rootCode }).session(session);
    if (!rebirthDoc) {
      const rebirthResults = await RebirthId.create(
        [
          {
            ownerUserId: user._id,
            ownerMemberId: memberId,
            rebirthCode: rootCode,
            displayCode: rootCode,
            sourceType: "INITIAL",
            rebirthType: "DEPOSIT_REBIRTH",
            sequenceNumber: 1,
            generation: 0,
            levelNumber: 0,
            levelSequence: 1,
            isInitialRebirth: true,
            usedInAutoPool: true,
            status: "PLACED",
            queueSerialNo: 1,
            placementSerialNo: 1,
            isPlaced: true,
            queueEnteredAt: new Date("2000-01-01T00:00:00Z"),
            placedAt: new Date("2000-01-01T00:00:00Z"),
            isActiveInAutopool: true,
          }
        ],
        { session }
      );
      rebirthDoc = rebirthResults[0];
    }

    const results = await AutoPoolNode.create(
      [
        {
          ownerUserId: user._id,
          ownerMemberId: memberId,
          nodeCode: rootCode,
          displayCode: rootCode,
          nodeId: rootCode,
          nodeType: "ROOT",
          rebirthType: "DEPOSIT_REBIRTH",
          rebirthId: rebirthDoc._id,
          rebirthCode: rootCode,
          status: "PLACED",
          isRoot: true,
          parentNodeId: null,
          matrixParentId: null,
          queueSerialNo: 1,
          placementSerialNo: 1,
          isPlaced: true,
          queueEnteredAt: new Date("2000-01-01T00:00:00Z"),
          placedAt: new Date("2000-01-01T00:00:00Z"),
          isActiveInAutopool: true,
        }
      ],
      { session }
    );
    rootNode = results[0];
  } else {
    let changed = false;
    if (!rootNode.isRoot) { rootNode.isRoot = true; changed = true; }
    if (rootNode.status !== "PLACED") { rootNode.status = "PLACED"; changed = true; }
    if (rootNode.parentNodeId !== null) { rootNode.parentNodeId = null; changed = true; }
    if (rootNode.matrixParentId !== null) { rootNode.matrixParentId = null; changed = true; }
    if (rootNode.queueSerialNo !== 1) { rootNode.queueSerialNo = 1; changed = true; }
    if (rootNode.placementSerialNo !== 1) { rootNode.placementSerialNo = 1; changed = true; }
    if (rootNode.isActiveInAutopool !== true) { rootNode.isActiveInAutopool = true; changed = true; }
    
    if (changed) {
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

  const displayCode = `${memberId}-0.2`;
  let node = await AutoPoolNode.findOne({ displayCode }).session(session);
  if (!node) {
    console.log(`[AutoPool] Enqueuing Admin Rebirth Node: ${displayCode}`);
    
    const nextSerial = await getNextQueueSerialNo(session);

    let rebirthDoc = await RebirthId.findOne({ displayCode }).session(session);
    if (!rebirthDoc) {
      const rebirthResults = await RebirthId.create(
        [
          {
            ownerUserId: user._id,
            ownerMemberId: memberId,
            rebirthCode: displayCode,
            displayCode: displayCode,
            sourceType: "INITIAL",
            rebirthType: "DEPOSIT_REBIRTH",
            sequenceNumber: 2,
            generation: 0,
            levelNumber: 0,
            levelSequence: 2,
            isInitialRebirth: true,
            usedInAutoPool: true,
            status: "PENDING",
            queueSerialNo: nextSerial,
            queueEnteredAt: new Date("2000-01-01T00:00:05Z"),
            isActiveInAutopool: true,
          },
        ],
        { session }
      );
      rebirthDoc = rebirthResults[0];
    }

    await AutoPoolNode.create(
      [
        {
          ownerUserId: user._id,
          ownerMemberId: memberId,
          nodeCode: displayCode,
          displayCode: displayCode,
          nodeId: displayCode,
          nodeType: "REBIRTH",
          rebirthType: "DEPOSIT_REBIRTH",
          rebirthId: rebirthDoc._id,
          rebirthCode: displayCode,
          levelNumber: 0,
          levelSequence: 2,
          status: "PENDING",
          queueSerialNo: nextSerial,
          queueEnteredAt: new Date("2000-01-01T00:00:05Z"),
          isActiveInAutopool: true,
        },
      ],
      { session }
    );
  }
}

// ─── Core Service Functions ────────────────────────────────────────────────────

export const autopool3x3Service = {
  processAutopoolUntilStable: async (session = null) => {
    return autopool3x3Service.processAutoPoolQueue(session);
  },

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

      let depositDoc = null;
      if (depositId) {
        depositDoc = await DepositModel.findById(depositId).session(s);
      }
      const originalCreatedAt = depositDoc ? depositDoc.createdAt : new Date();

      for (let i = 1; i <= 2; i++) {
        const displayCode = generateRebirthCode({
          memberId: memberId,
          level: 0,
          sequence: i,
        });

        // Atomic check/create to prevent duplicates
        let node = await AutoPoolNode.findOne({ displayCode }).session(s);
        if (!node) {
          const nextSerial = await getNextQueueSerialNo(s);

          // Keep RebirthId model synchronized
          let rebirthDoc = await RebirthId.findOne({ displayCode }).session(s);
          if (!rebirthDoc) {
            const rebirthResults = await RebirthId.create(
              [
                {
                  ownerUserId: userId,
                  ownerMemberId: memberId,
                  rebirthCode: displayCode,
                  displayCode: displayCode,
                  depositId,
                  sourceType: "INITIAL",
                  rebirthType: "DEPOSIT_REBIRTH",
                  sequenceNumber: i,
                  generation: 0,
                  levelNumber: 0,
                  levelSequence: i,
                  isInitialRebirth: true,
                  usedInAutoPool: true,
                  status: "PENDING",
                  queueSerialNo: nextSerial,
                  queueEnteredAt: new Date(),
                  originalCreatedAt,
                  isActiveInAutopool: true,
                },
              ],
              { session: s }
            );
            rebirthDoc = rebirthResults[0];
          } else {
            if (!rebirthDoc.queueSerialNo || rebirthDoc.rebirthType !== "DEPOSIT_REBIRTH") {
              rebirthDoc.queueSerialNo = nextSerial;
              rebirthDoc.rebirthType = "DEPOSIT_REBIRTH";
              rebirthDoc.originalCreatedAt = originalCreatedAt;
              rebirthDoc.queueEnteredAt = rebirthDoc.queueEnteredAt || new Date();
              rebirthDoc.isActiveInAutopool = true;
              await rebirthDoc.save({ session: s });
            }
          }

          const results = await AutoPoolNode.create(
            [
              {
                ownerUserId: userId,
                ownerMemberId: memberId,
                nodeCode: displayCode,
                displayCode: displayCode,
                nodeId: displayCode,
                nodeType: "REBIRTH",
                rebirthType: "DEPOSIT_REBIRTH",
                rebirthId: rebirthDoc._id,
                levelNumber: 0,
                levelSequence: i,
                depositId: depositId,
                status: "PENDING",
                queueSerialNo: nextSerial,
                queueEnteredAt: rebirthDoc.queueEnteredAt,
                originalCreatedAt,
                isActiveInAutopool: true,
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
            isMainUserNode: true,
            isActiveInAutopool: false,
            excludedFromQueue: true,
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
    // Finds the oldest active placed node with capacity (< 3 children)
    // sorted strictly by queueSerialNo ASC, queueEnteredAt ASC, _id ASC.
    return await AutoPoolNode.findOne({
      status: "PLACED",
      isActiveInAutopool: true,
      nodeType: { $in: ["ROOT", "REBIRTH"] },
      directChildrenCount: { $lt: 3 },
    })
      .sort({ queueSerialNo: 1, queueEnteredAt: 1, _id: 1 })
      .session(session);
  },

  processAutoPoolQueue: async (session = null) => {
    if (await isAutopoolRepairLocked(session)) {
      return { processedCount: 0, skipped: true, repairLocked: true };
    }

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
          // 1. Find oldest pending active node sorted chronologically
          const pendingNode = await AutoPoolNode.findOne({
            status: "PENDING",
            isActiveInAutopool: true,
          })
            .sort({ queueSerialNo: 1, queueEnteredAt: 1, _id: 1 })
            .session(s);

          if (!pendingNode) break;

          // 2. Find oldest available parent
          const availableParent =
            await autopool3x3Service.findNextAvailableParent(s);

          if (!availableParent) {
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
              isActiveInAutopool: true,
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

          const childSlot = updateResult.directChildrenCount;
          const placementSerialNo = await getNextPlacementSerialNo(s);

          // 4. Update child node status to PLACED
          pendingNode.status = "PLACED";
          pendingNode.isPlaced = true;
          pendingNode.matrixParentId = availableParent._id;
          pendingNode.parentNodeId = availableParent._id;
          pendingNode.childSlot = childSlot;
          pendingNode.placementSerialNo = placementSerialNo;
          pendingNode.placedAt = new Date();
          await pendingNode.save({ session: s });

          // Also keep RebirthId synchronized if it exists
          if (pendingNode.rebirthId) {
            await RebirthId.findByIdAndUpdate(
              pendingNode.rebirthId,
              {
                $set: {
                  status: "PLACED",
                  isPlaced: true,
                  parentNodeId: availableParent._id,
                  childSlot,
                  placementSerialNo,
                  placedAt: pendingNode.placedAt,
                }
              },
              { session: s }
            );
          }

          console.log(
            `[AutoPool] Placed node ${pendingNode.nodeCode} under ${availableParent.nodeCode} at slot ${childSlot} with placementSerialNo ${placementSerialNo}`
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
   * Uses atomic findOneAndUpdate to prevent double-completion race conditions
   * from the background 10-second job and concurrent deposit processing.
   */
  completeAutoPoolNode: async (nodeId, session = null) => {
    const fn = async (s) => {
      // ─── Atomic completion guard ────────────────────────────────────────────
      // Only marks PLACED → COMPLETED. If already COMPLETED (another transaction
      // beat us), we still proceed to check rebirth generation in case it was missed.
      const atomicResult = await AutoPoolNode.findOneAndUpdate(
        { _id: nodeId, status: "PLACED", isActiveInAutopool: true }, // Only transition from PLACED
        { $set: { status: "COMPLETED", completedAt: new Date() } },
        { new: true, session: s }
      );

      // Fetch current node state regardless of whether we just completed it
      const node = atomicResult || await AutoPoolNode.findById(nodeId).session(s);
      if (!node) throw new Error(`Node ${nodeId} not found`);

      if (atomicResult) {
        // We just completed it — run all downstream hooks
        console.log(`[AutoPool] Completed node: ${node.nodeCode}`);

        // Sync RebirthId collection status
        if (node.rebirthId) {
          await RebirthId.findByIdAndUpdate(
            node.rebirthId,
            { $set: { status: "COMPLETED" } },
            { session: s }
          );
        } else {
          await RebirthId.findOneAndUpdate(
            { rebirthCode: node.nodeCode },
            { $set: { status: "COMPLETED" } },
            { session: s }
          );
        }
      } else {
        // Node was already COMPLETED by another transaction
        console.log(`[AutoPool] Node ${node.nodeCode} already COMPLETED (concurrent), verifying rebirth generation...`);
      }

      // Always ensure rebirth generation and level checks happen,
      // even if completion was done by another transaction (repair path).
      //
      // ROOT nodes are treated identically to REBIRTH nodes for completion:
      // BKS000000-0.1 is both the tree root AND the admin's first rebirth ID.
      // When it fills up (3 children) it must generate BKS000000-1.1 and
      // BKS000000-1.2 exactly as any other completed rebirth node would.
      if (node.nodeType === "REBIRTH" || node.nodeType === "ROOT") {
        // Fund processing is idempotent (checks for existing ledger entry)
        await autopoolFundService.processRebirthCompletionFund(node._id, s);

        // Rebirth generation is idempotent via rebirthGenerated flag
        await autopool3x3Service.generateNextLevelRebirthsForCompletedRebirthNode(
          node.ownerUserId,
          node.levelNumber,
          node.levelSequence,
          s
        );
      }

      // Level completion check is idempotent (checks AutoPoolLevelCompletion record)
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
   * Generate next level rebirth IDs deterministically for a completed rebirth node
   * Formula: Sequence S completes -> generates sequence 2*S - 1 and 2*S at level L+1
   *
   * IDEMPOTENCY: Uses atomic findOneAndUpdate on the completed node's rebirthGenerated
   * flag so that concurrent calls (from the 10-second background job vs. deposit
   * processor) never create duplicate rebirths.
   */
  generateNextLevelRebirthsForCompletedRebirthNode: async (
    ownerUserId,
    completedLevel,
    completedSequence,
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
      // Deterministic children sequences
      const sequencesToCreate = [2 * completedSequence - 1, 2 * completedSequence];

      // ─── Atomic idempotency guard ─────────────────────────────────────────
      const guardResult = await AutoPoolNode.findOneAndUpdate(
        {
          ownerUserId,
          levelNumber: completedLevel,
          levelSequence: completedSequence,
          status: "COMPLETED",
          rebirthGenerated: false, // Only proceed if NOT already generated
          isActiveInAutopool: true,
        },
        {
          $set: {
            rebirthGenerated: true,
            rebirthGeneratedAt: new Date(),
          },
        },
        { new: true, session: s }
      );

      if (!guardResult) {
        console.log(
          `[AutoPool] Rebirth generation for ${memberId} L${completedLevel}S${completedSequence} already done or inactive, skipping.`
        );
        return;
      }
      // ─────────────────────────────────────────────────────────────────────

      console.log(`[AutoPool] Generating rebirth sequences ${sequencesToCreate.join(", ")} for ${memberId} at Level ${nextLevel} from parent seq ${completedSequence}`);

      const rebirthNodes = [];
      const now = new Date();

      for (const seq of sequencesToCreate) {
        const displayCode = generateRebirthCode({
          memberId,
          level: nextLevel,
          sequence: seq,
        });

        let newNode = await AutoPoolNode.findOne({ nodeCode: displayCode }).session(s);
        if (!newNode) {
          const nextSerial = await getNextQueueSerialNo(s);

          // Keep RebirthId model synchronized
          let rebirthDoc = await RebirthId.findOne({ displayCode }).session(s);
          if (!rebirthDoc) {
            const rebirthResults = await RebirthId.create(
              [
                {
                  ownerUserId,
                  ownerMemberId: memberId,
                  rebirthCode: displayCode,
                  displayCode: displayCode,
                  sourceType: "AUTOPool_COMPLETION",
                  rebirthType: "AUTOPOOL_GENERATED_REBIRTH",
                  sequenceNumber: seq,
                  generation: nextLevel,
                  levelNumber: nextLevel,
                  levelSequence: seq,
                  isInitialRebirth: false,
                  usedInAutoPool: true,
                  status: "PENDING",
                  queueSerialNo: nextSerial,
                  queueEnteredAt: now,
                  originalCreatedAt: now,
                  isActiveInAutopool: true,
                },
              ],
              { session: s }
            );
            rebirthDoc = rebirthResults[0];
          } else {
            if (!rebirthDoc.queueSerialNo || rebirthDoc.rebirthType !== "AUTOPOOL_GENERATED_REBIRTH") {
              rebirthDoc.queueSerialNo = nextSerial;
              rebirthDoc.rebirthType = "AUTOPOOL_GENERATED_REBIRTH";
              rebirthDoc.originalCreatedAt = now;
              rebirthDoc.queueEnteredAt = rebirthDoc.queueEnteredAt || now;
              rebirthDoc.isActiveInAutopool = true;
              await rebirthDoc.save({ session: s });
            }
          }

          const results = await AutoPoolNode.create(
            [
              {
                ownerUserId,
                ownerMemberId: memberId,
                nodeCode: displayCode,
                displayCode: displayCode,
                nodeId: displayCode,
                nodeType: "REBIRTH",
                rebirthType: "AUTOPOOL_GENERATED_REBIRTH",
                rebirthId: rebirthDoc._id,
                levelNumber: nextLevel,
                levelSequence: seq,
                status: "PENDING",
                queueSerialNo: nextSerial,
                queueEnteredAt: rebirthDoc.queueEnteredAt,
                originalCreatedAt: now,
                isActiveInAutopool: true,
              },
            ],
            { session: s },
          );
          newNode = results[0];
          console.log(`[AutoPool] Created rebirth node ${displayCode}`);
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
        isActiveInAutopool: true,
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

          // Get list of completed rebirth display codes for this round
          const completedRebirths = await AutoPoolNode.find({
            ownerUserId,
            levelNumber,
            status: "COMPLETED",
            isActiveInAutopool: true,
          }).select("nodeCode").session(s);
          const sourceRebirthIds = completedRebirths.map((r) => r.nodeCode);

          // --- NEW FUND MANAGEMENT HOOK ---
          // Credit isolated Pool, Reinvestment, Withdrawable funds & handle Upgrade deductions.
          // IMPORTANT: Pass `levelNumber` directly (NOT +1).
          // Fund maps: POOL_FUND_MAP[0]=0, POOL_FUND_MAP[1]=120, etc.
          // Round 0 completion generates Level 1 rebirths but releases NO funds.
          // Round 1 completion releases Level 1 funds ($120 Pool / $100 Reinvest / $20 Withdrawable).
          const { applyAutopoolFundCompletion } = await import("./autopool-fund-new.service.js");
          await applyAutopoolFundCompletion(ownerUserId, levelNumber, sourceRebirthIds, s);

          // --- LEGACY DISTRIBUTION HOOK ---
          // Process standard sponsor referral ($2.5 per next round rebirth) and company fees
          await autopoolFundService.processLevelDistribution(
            ownerUserId,
            levelNumber,
            s,
          );

          // [MODIFIED] Skipped level-wide generateNextLevelRebirthsForCompletedLevel
          // because deterministic rebirth IDs are created immediately node-by-node!
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
    const nodes = await AutoPoolNode.find({ ownerUserId: userId, isActiveInAutopool: true })
      .populate("matrixParentId", "nodeCode nodeType status")
      .populate("directChildren", "nodeCode nodeType status")
      .populate("rebirthId", "displayCode")
      .sort({ queueSerialNo: 1, queueEnteredAt: 1, _id: 1 });

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
      isActiveInAutopool: true,
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
      .sort({ queueSerialNo: 1, queueEnteredAt: 1, _id: 1 })
      .lean();

    const rootNode = allScopedCandidates.find(
      (node) =>
        (node.nodeCode === "BKS000000-0.1" || node.nodeCode === `${adminUser.memberId}-0.1`) &&
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
    const rebirths = await RebirthId.find({ ownerUserId: userId, isActiveInAutopool: true }).sort({
      levelNumber: 1,
      levelSequence: 1,
    });

    return rebirths;
  },

  /**
   * Get AutoPool tree (admin)
   */
  getAutoPoolTree: async (options = {}) => {
    const normalizedOptions = typeof options === "number" ? { limit: options } : options || {};
    const limit = Number(normalizedOptions.limit ?? 100);
    const depthLimit = Number.isFinite(Number(normalizedOptions.depth)) ? Math.max(0, Number(normalizedOptions.depth)) : null;
    const rootCode = normalizedOptions.root || null;

    const baseQuery = AutoPoolNode.find({ isActiveInAutopool: true })
      .populate("ownerUserId", "memberId email fullName")
      .populate("matrixParentId", "nodeCode")
      .populate("userId", "memberId")
      .populate("rebirthId", "displayCode")
      .sort({ queueSerialNo: 1, queueEnteredAt: 1, _id: 1 });

    if (rootCode) {
      const rootNode = await AutoPoolNode.findOne({
        isActiveInAutopool: true,
        $or: [{ nodeCode: rootCode }, { rebirthCode: rootCode }, { displayCode: rootCode }],
      }).lean();

      if (!rootNode) {
        return [];
      }

      if (depthLimit === 0) {
        return [rootNode];
      }

      const collected = [rootNode];
      let frontierIds = [rootNode._id];
      let depth = 0;

      while (frontierIds.length > 0 && (depthLimit === null || depth < depthLimit)) {
        const children = await AutoPoolNode.find({
          isActiveInAutopool: true,
          parentNodeId: { $in: frontierIds },
        })
          .populate("ownerUserId", "memberId email fullName")
          .populate("matrixParentId", "nodeCode")
          .populate("userId", "memberId")
          .populate("rebirthId", "displayCode")
          .sort({ childSlot: 1, queueSerialNo: 1, queueEnteredAt: 1, _id: 1 });

        if (!children.length) break;
        collected.push(...children);
        frontierIds = children.map((node) => node._id);
        depth += 1;
      }

      return limit > 0 ? collected.slice(0, limit) : collected;
    }

    if (limit > 0) {
      baseQuery.limit(limit);
    }

    return baseQuery;
  },

  getAutoPoolNodeChildren: async (rebirthCode, options = {}) => {
    const pageNum = parseInt(options.page) || 1;
    const limitNum = parseInt(options.limit) || 50;
    const skip = (pageNum - 1) * limitNum;

    const parent = await AutoPoolNode.findOne({ nodeCode: rebirthCode, isActiveInAutopool: true }).lean();
    if (!parent) {
      return { parent: null, children: [], pagination: { total: 0, page: pageNum, limit: limitNum, totalPages: 0 } };
    }

    const filter = { parentNodeId: parent._id, isActiveInAutopool: true };
    const total = await AutoPoolNode.countDocuments(filter);
    const children = await AutoPoolNode.find(filter)
      .populate("ownerUserId", "memberId fullName")
      .populate("rebirthId", "displayCode")
      .sort({ childSlot: 1, queueSerialNo: 1, queueEnteredAt: 1, _id: 1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    return {
      parent,
      children,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: limitNum > 0 ? Math.ceil(total / limitNum) : 1,
      },
    };
  },

  getQueueAudit: async (options = {}) => {
    const fromSerial = options.fromSerial !== undefined && options.fromSerial !== "" ? Number(options.fromSerial) : null;
    const toSerial = options.toSerial !== undefined && options.toSerial !== "" ? Number(options.toSerial) : null;
    const limitNum = parseInt(options.limit) || 200;
    const pageNum = parseInt(options.page) || 1;
    const skip = (pageNum - 1) * limitNum;

    const filter = { isActiveInAutopool: true };
    if (Number.isFinite(fromSerial) || Number.isFinite(toSerial)) {
      filter.queueSerialNo = {};
      if (Number.isFinite(fromSerial)) filter.queueSerialNo.$gte = fromSerial;
      if (Number.isFinite(toSerial)) filter.queueSerialNo.$lte = toSerial;
    }

    const total = await AutoPoolNode.countDocuments(filter);
    const entries = await AutoPoolNode.find(filter)
      .populate("ownerUserId", "memberId fullName")
      .populate("matrixParentId", "nodeCode")
      .select("nodeCode rebirthCode queueSerialNo queueEnteredAt status isCompleted completedAt parentNodeId matrixParentId childSlot ownerUserId round sequence repairStatus repairVersion")
      .sort({ queueSerialNo: 1, queueEnteredAt: 1, _id: 1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    return {
      entries,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: limitNum > 0 ? Math.ceil(total / limitNum) : 1,
      },
    };
  },

  /**
   * Get AutoPool queue status
   */
  getQueueStatus: async () => {
    const nodeTypeFilter = { $in: ["ROOT", "REBIRTH"] };

    const totalEntries = await AutoPoolNode.countDocuments({
      nodeType: nodeTypeFilter,
      isActiveInAutopool: true,
    });
    const pendingEntries = await AutoPoolNode.countDocuments({
      nodeType: nodeTypeFilter,
      status: "PENDING",
      isActiveInAutopool: true,
    });
    const placedEntries = await AutoPoolNode.countDocuments({
      nodeType: nodeTypeFilter,
      status: "PLACED",
      isActiveInAutopool: true,
    });
    const completedEntries = await AutoPoolNode.countDocuments({
      nodeType: nodeTypeFilter,
      status: "COMPLETED",
      isActiveInAutopool: true,
    });

    return {
      totalEntries,
      pendingEntries,
      placedEntries,
      completedEntries,
      totalRebirths: totalEntries,
      queueWaiting: pendingEntries,
      queueProcessing: 0,
    };
  },

  /**
   * Get AutoPool queue nodes (list)
   */
  getQueueNodes: async (limit = 100, page = 1, returnTotal = false, search = "") => {
    const skip = (page - 1) * limit;
    const filter = { nodeType: { $in: ["ROOT", "REBIRTH"] }, isActiveInAutopool: true };
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
      .sort({ queueSerialNo: 1, queueEnteredAt: 1, _id: 1 });

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
    const nodes = await AutoPoolNode.find({ status: "COMPLETED", isActiveInAutopool: true })
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
    const nodes = await AutoPoolNode.find({ ownerUserId: userId, isActiveInAutopool: true, nodeType: { $ne: "MAIN" } })
      .populate("matrixParentId", "nodeCode")
      .populate("directChildren", "nodeCode")
      .populate("rebirthId", "displayCode")
      .sort({ queueSerialNo: 1, queueEnteredAt: 1 });

    const rebirths = await RebirthId.find({ ownerUserId: userId, isActiveInAutopool: true }).sort({
      levelNumber: 1,
      levelSequence: 1,
    });

    return {
      user,
      nodes: nodes.map((node) => ({
        ...node,
        status: getNodeDisplayStatus(node),
      })),
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

    const total = await User.countDocuments(userFilter);

    const allUsers = await User.find(userFilter)
      .select("memberId fullName email sponsorId phone createdAt isAliasAccount aliasOfUserId aliasOfAccountId rootOwnerUserId rootOwnerAccountId createdFromAutopoolLevel")
      .sort({ createdAt: 1, _id: 1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const userIds = allUsers.map((u) => u._id);
    const autopoolFunds = await AutopoolUserFund.find({ userId: { $in: userIds } }).lean();
    const fundMap = new Map(autopoolFunds.map((f) => [f.userId.toString(), f]));

    const results = [];
    for (const user of allUsers) {
      const nodes = await AutoPoolNode.find({ ownerUserId: user._id, isActiveInAutopool: true, nodeType: { $ne: "MAIN" } })
        .select("levelNumber status isCompleted completedAt directChildrenCount")
        .lean();

      const hasAnyRebirth = nodes.length > 0;
      const totalCompletedRebirths = nodes.filter((n) => isNodeCompletedForReport(n)).length;
      const latestCompletedLevel = getCompletedLevelFromCompletedCount(totalCompletedRebirths);
      const currentLevel = getCurrentActiveLevelFromCompletedCount(totalCompletedRebirths);

      const fundRecord = fundMap.get(user._id.toString());
      const completedAutopoolLevel =
        latestCompletedLevel ?? getResolvedCompletedAutopoolLevel(-1, fundRecord);
      const autopoolFundSummary = calculateAutopoolFundSummary(
        completedAutopoolLevel ?? 0,
      );

      let userStatus = "Pending";
      if (completedAutopoolLevel === 9) {
        userStatus = "Completed";
      } else if (completedAutopoolLevel !== null || hasAnyRebirth) {
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
        completedRebirthsCount: totalCompletedRebirths,
        pendingRebirthsCount: nodes.filter((n) => !isNodeCompletedForReport(n)).length,
        currentLevel,
        latestCompletedLevel: completedAutopoolLevel,
        completedAutopoolLevel,
        status: userStatus,
        isAliasAccount: user.isAliasAccount || false,
        aliasOfUserId: user.aliasOfUserId || null,
        aliasOfAccountId: user.aliasOfAccountId || null,
        rootOwnerUserId: user.rootOwnerUserId || null,
        rootOwnerAccountId: user.rootOwnerAccountId || null,
        createdFromAutopoolLevel: user.createdFromAutopoolLevel ?? null,
        poolFundTotal: autopoolFundSummary.poolFundTotal,
        reinvestmentFundTotal: autopoolFundSummary.reinvestmentFundTotal,
        withdrawableAutopoolFund: autopoolFundSummary.withdrawableAutopoolFund,
        upgradeIdCount: autopoolFundSummary.upgradeIdCount,
        upgradeDeductionTotal: autopoolFundSummary.upgradeDeductionTotal,
        autopoolFundSummary,
        isolatedWithdrawableAutopoolFund: autopoolFundSummary.withdrawableAutopoolFund,
        isolatedPoolFundTotal: autopoolFundSummary.poolFundTotal,
        isolatedReinvestmentFundTotal: autopoolFundSummary.reinvestmentFundTotal,
        isolatedUpgradeIdCount: autopoolFundSummary.upgradeIdCount,
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

    const paginated = filteredResults;

    return {
      users: paginated,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: limitNum > 0 ? Math.ceil(total / limitNum) : 1,
      },
    };
  },

  /**
   * Get complete details of one user's individual autopool progress
   */
  getIndividualAutopoolDetails: async (userId) => {
    const { WalletModel } = await import("../user/wallet.model.js");
    const { AutopoolUserFund } = await import("./autopool-user-fund.model.js");

    const user = await User.findById(userId).lean();
    if (!user) throw new Error("User not found");

    const wallet = await WalletModel.findOne({ userRef: userId }).lean();
    const autopoolFund = await AutopoolUserFund.findOne({ userId }).lean();
    const allUserNodes = await AutoPoolNode.find({ ownerUserId: userId, isActiveInAutopool: true })
      .populate("matrixParentId", "nodeCode")
      .lean();
    const reportableNodes = allUserNodes.filter((node) => node.nodeType !== "MAIN");

    // Map children nodes for rendering child codes
    const allChildrenIds = reportableNodes.reduce((acc, n) => {
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
    const allNodeIds = reportableNodes.map((n) => n._id);
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
    const totalCompletedRebirths = reportableNodes.filter(
      (n) => isNodeCompletedForReport(n)
    ).length;
    const latestCompletedLevel = getCompletedLevelFromCompletedCount(totalCompletedRebirths);
    const currentActiveLevel = getCurrentActiveLevelFromCompletedCount(totalCompletedRebirths);

    for (let r = 0; r <= 9; r++) {
      const required = Math.pow(2, r + 1);
      const roundNodes = reportableNodes.filter((n) => n.levelNumber === r);
      const completedCount = roundNodes.filter((n) => isNodeCompletedForReport(n)).length;
      const generatedCount = roundNodes.length;

      let status = "Pending";
      if (generatedCount === required && completedCount === required) {
        status = "Completed";
      } else if (generatedCount > 0 || completedCount > 0) {
        status = "In Progress";
      }

      if (latestCompletedLevel !== null && r <= latestCompletedLevel) {
        status = "Completed";
      } else if (r === currentActiveLevel && (generatedCount > 0 || completedCount > 0)) {
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
          status: getNodeDisplayStatus(n) === "COMPLETED"
            ? "Completed"
            : getNodeDisplayStatus(n) === "PLACED"
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

    const totalRebirths = reportableNodes.length;
    const totalPendingRebirths = totalRebirths - totalCompletedRebirths;

    const resolvedCompletedLevel = latestCompletedLevel;
    const { summary: autopoolFundSummary } =
      await reconcileAutopoolFundSummary({
        userId,
        completedLevel: resolvedCompletedLevel,
        fundRecord: autopoolFund,
      });

    const completedLevelForLedger = resolvedCompletedLevel ?? -1;

    const transactions = await AutopoolFundTransaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          completedLevel: { $lte: completedLevelForLedger },
        },
      },
      {
        $group: {
          _id: null,
          transactionCount: { $sum: 1 },
          poolFundTotal: {
            $sum: {
              $cond: [
                { $eq: ["$type", "POOL_FUND_CREDIT"] },
                "$amount",
                0,
              ],
            },
          },
          reinvestmentFundTotal: {
            $sum: {
              $cond: [
                { $eq: ["$type", "REINVESTMENT_FUND_CREDIT"] },
                "$amount",
                0,
              ],
            },
          },
          withdrawableAutopoolFund: {
            $sum: {
              $cond: [
                { $eq: ["$type", "WITHDRAWABLE_AUTOPOOL_CREDIT"] },
                "$amount",
                0,
              ],
            },
          },
          upgradeDeductionTotal: {
            $sum: {
              $cond: [
                { $eq: ["$type", "UPGRADE_ID_DEDUCTION"] },
                "$amount",
                0,
              ],
            },
          },
          upgradeIdCount: {
            $sum: {
              $cond: [
                { $eq: ["$type", "UPGRADE_ID_DEDUCTION"] },
                { $divide: ["$amount", UPGRADE_ID_COST] },
                0,
              ],
            },
          },
        },
      },
    ]);

    const ledgerSummary = transactions[0] || null;
    const ledgerMatchesSummary = ledgerSummary
      ? [
          ["poolFundTotal", ledgerSummary.poolFundTotal],
          ["reinvestmentFundTotal", ledgerSummary.reinvestmentFundTotal],
          ["withdrawableAutopoolFund", ledgerSummary.withdrawableAutopoolFund],
          ["upgradeIdCount", ledgerSummary.upgradeIdCount],
          ["upgradeDeductionTotal", ledgerSummary.upgradeDeductionTotal],
        ].every(([key, value]) => Number(value || 0) === Number(autopoolFundSummary[key] || 0))
      : false;

    if (!ledgerMatchesSummary) {
      console.warn(
        `[AutoPool] Reconciled autopool fund summary for ${userId} at level ${resolvedCompletedLevel}. Ledger matches: ${ledgerSummary ? "no" : "n/a"}`,
      );
    }

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
        latestCompletedLevel: resolvedCompletedLevel,
        completedAutopoolLevel: resolvedCompletedLevel,
        withdrawableWalletAmount: wallet?.withdrawableFund || 0,
        poolFundAmount: wallet?.fundWallet || 0,
        // NEW ISOLATED WALLETS
        poolFundTotal: autopoolFundSummary.poolFundTotal,
        reinvestmentFundTotal: autopoolFundSummary.reinvestmentFundTotal,
        withdrawableAutopoolFund: autopoolFundSummary.withdrawableAutopoolFund,
        upgradeIdCount: autopoolFundSummary.upgradeIdCount,
        upgradeDeductionTotal: autopoolFundSummary.upgradeDeductionTotal,
        autopoolFundSummary,
        isolatedWithdrawableAutopoolFund: autopoolFundSummary.withdrawableAutopoolFund,
        isolatedPoolFundTotal: autopoolFundSummary.poolFundTotal,
        isolatedReinvestmentFundTotal: autopoolFundSummary.reinvestmentFundTotal,
        isolatedUpgradeIdCount: autopoolFundSummary.upgradeIdCount,
        isolatedUpgradeDeductionTotal: autopoolFundSummary.upgradeDeductionTotal,
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

    const nodes = await AutoPoolNode.find({ ownerUserId: userId, isActiveInAutopool: true })
      .populate("matrixParentId", "nodeCode ownerUserId")
      .lean();
    const reportableNodes = nodes.filter((node) => node.nodeType !== "MAIN");

    const userNodeIds = new Set(reportableNodes.map((n) => n._id.toString()));

    const mappedNodes = reportableNodes.map((node) => {
      const hasParentInTree =
        node.matrixParentId && userNodeIds.has(node.matrixParentId._id.toString());

      return {
        ...node,
        poolNodeId: node.nodeCode,
        status: getNodeDisplayStatus(node),
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

export { calculateAutopoolFundSummary, UPGRADE_ID_COST };

export default autopool3x3Service;
