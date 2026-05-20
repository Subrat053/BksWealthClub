import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { User } from "../modules/user/user.model.js";
import { DepositModel } from "../modules/deposit/deposit.model.js";
import { AutoPoolNode } from "../modules/autopool/autopool-matrix.model.js";
import { RebirthId } from "../modules/autopool/rebirth.model.js";
import { AutoPoolLevelCompletion } from "../modules/autopool/autopool-level-completion.model.js";
import { AutopoolUserFund } from "../modules/autopool/autopool-user-fund.model.js";
import { UpgradeAliasId } from "../modules/autopool/upgrade-alias-id.model.js";
import {
  calculateAutopoolFundSummary,
  getCompletedLevelFromCompletedRebirths,
  getCurrentActiveLevelFromCompletedRebirths,
  generateRebirthCode,
} from "../modules/autopool/autopool-3x3.service.js";
import {
  acquireAutopoolRepairLock,
  releaseAutopoolRepairLock,
  AUTOPOOL_REPAIR_VERSION,
} from "../modules/autopool/autopool-repair-lock.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../../.env") });

const args = process.argv.slice(2);
const flags = new Set(args.filter((arg) => arg.startsWith("--")));
const applyMode = flags.has("--apply");
const dryRun = flags.has("--dry-run") || !applyMode;
const validateOnly = flags.has("--validate");
const repairLabel = "chronological-replay";
const actor = `script:${repairLabel}`;

function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function fallbackTimestamp(...candidates) {
  for (const candidate of candidates) {
    const date = toDate(candidate);
    if (date) return date;
  }
  return new Date(0);
}

function objectIdTimestamp(value) {
  try {
    if (value && mongoose.isValidObjectId(value)) {
      return new Date(Number.parseInt(String(value).slice(0, 8), 16) * 1000);
    }
  } catch {
    // ignore
  }
  return null;
}

function resolveSortTimestamp(entity, user, deposit = null) {
  return fallbackTimestamp(
    entity?.createdAt,
    entity?.queueTimestamp,
    entity?.placedAt,
    entity?.completedAt,
    deposit?.createdAt,
    user?.createdAt,
    objectIdTimestamp(entity?._id),
    objectIdTimestamp(deposit?._id),
    objectIdTimestamp(user?._id),
  );
}

function generateCode(memberId, round, sequence) {
  return generateRebirthCode({ memberId, level: round, sequence });
}

function childSequences(sequence) {
  return [2 * sequence - 1, 2 * sequence];
}

function compareCandidates(a, b) {
  const diffTime = a.sortTimestamp.getTime() - b.sortTimestamp.getTime();
  if (diffTime !== 0) return diffTime;
  const diffQueue = (a.queueIndex ?? 0) - (b.queueIndex ?? 0);
  if (diffQueue !== 0) return diffQueue;
  const diffRound = (a.round ?? 0) - (b.round ?? 0);
  if (diffRound !== 0) return diffRound;
  const diffSequence = (a.sequence ?? 0) - (b.sequence ?? 0);
  if (diffSequence !== 0) return diffSequence;
  return String(a._id).localeCompare(String(b._id));
}

function roundSize(round) {
  return Math.pow(2, round + 1);
}

function normalizeRound(node) {
  const round = Number.isFinite(Number(node?.round))
    ? Number(node.round)
    : Number.isFinite(Number(node?.levelNumber))
      ? Number(node.levelNumber)
      : Number.isFinite(Number(node?.generation))
        ? Number(node.generation)
        : 0;
  return Math.max(0, round);
}

function normalizeSequence(node) {
  const sequence = Number.isFinite(Number(node?.sequence))
    ? Number(node.sequence)
    : Number.isFinite(Number(node?.levelSequence))
      ? Number(node.levelSequence)
      : Number.isFinite(Number(node?.sequenceNumber))
        ? Number(node.sequenceNumber)
        : 0;
  return Math.max(0, sequence);
}

function getCode(node) {
  return node?.displayCode || node?.rebirthCode || node?.nodeCode || null;
}

function getCompletedCount(nodes) {
  return nodes.filter((node) => node.isCompleted || node.status === "COMPLETED").length;
}

function calculateLevelFromReplay(roundCompletionMap) {
  let latestCompletedLevel = null;
  for (const [round, info] of roundCompletionMap.entries()) {
    const expected = roundSize(round);
    if (info.completed >= expected) {
      latestCompletedLevel = round;
    } else {
      break;
    }
  }
  return latestCompletedLevel;
}

function insertSorted(list, item) {
  list.push(item);
  list.sort(compareCandidates);
}

function summarizeDifferences(items) {
  return items.length ? items.slice(0, 25) : [];
}

function compareOpenParents(a, b) {
  const diffPlaced = (a.placedAt?.getTime?.() || 0) - (b.placedAt?.getTime?.() || 0);
  if (diffPlaced !== 0) return diffPlaced;
  const diffQueue = (a.queueOrder ?? 0) - (b.queueOrder ?? 0);
  if (diffQueue !== 0) return diffQueue;
  return String(a.code || a.nodeCode || a._id).localeCompare(String(b.code || b.nodeCode || b._id));
}

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is missing");
  }

  console.log("==================================================");
  console.log("Chronological AutoPool replay repair");
  console.log(`Mode: ${dryRun ? "dry-run" : "apply"}`);
  console.log(`Repair version: ${AUTOPOOL_REPAIR_VERSION}`);
  console.log("==================================================");

  await mongoose.connect(process.env.MONGODB_URI);

  const lock = await acquireAutopoolRepairLock({
    lockedBy: actor,
    mode: dryRun ? "dry-run" : "apply",
  });

  if (!lock) {
    throw new Error("Unable to acquire autopool repair lock");
  }

  const stats = {
    users: 0,
    placementsChanged: 0,
    missingRebirths: 0,
    duplicateRebirths: 0,
    usersWithLevelChange: 0,
    usersWithFundChange: 0,
    dangerousConflicts: 0,
    queueIndexesUpdated: 0,
    levelCompletionsUpdated: 0,
    fundSummariesUpdated: 0,
  };

  try {
    const users = await User.find({})
      .select("memberId fullName createdAt email")
      .sort({ createdAt: 1, _id: 1 })
      .lean();
    const userById = new Map(users.map((user) => [String(user._id), user]));

    const deposits = await DepositModel.find({})
      .sort({ createdAt: 1, _id: 1 })
      .lean();
    const rebirthDocs = await RebirthId.find({})
      .sort({ createdAt: 1, _id: 1 })
      .lean();
    const nodeDocs = await AutoPoolNode.find({ nodeType: "REBIRTH" })
      .sort({ createdAt: 1, _id: 1 })
      .lean();
    const rootNode = await AutoPoolNode.findOne({ nodeType: "ROOT" })
      .sort({ createdAt: 1, _id: 1 })
      .lean();

    const nodeByCode = new Map();
    const rebirthByCode = new Map();

    for (const node of nodeDocs) {
      const code = getCode(node);
      if (code && !nodeByCode.has(code)) {
        nodeByCode.set(code, node);
      }
    }

    for (const rebirth of rebirthDocs) {
      const code = getCode(rebirth);
      if (code && !rebirthByCode.has(code)) {
        rebirthByCode.set(code, rebirth);
      }
    }

    const existingByCode = new Map();
    for (const [code, rebirth] of rebirthByCode.entries()) {
      existingByCode.set(code, {
        rebirth,
        node: nodeByCode.get(code) || null,
      });
    }

    const replayedByCode = new Map();
    const seenCodes = new Set();
    const openParents = [];
    const pending = [];
    const duplicateCandidates = [];
    const userReplayState = new Map();

    const rootRecord = rootNode
      ? {
          code: rootNode.nodeCode,
          dbId: rootNode._id,
          ownerUserId: rootNode.ownerUserId || null,
          memberId: rootNode.ownerMemberId || rootNode.nodeCode,
          round: -1,
          sequence: 0,
          queueOrder: 0,
          placementOrder: 0,
          placedAt: toDate(rootNode.placedAt) || toDate(rootNode.createdAt) || new Date(0),
          completedAt: null,
          isCompleted: false,
          nodeType: "ROOT",
          children: [],
          sortTimestamp: toDate(rootNode.queueTimestamp) || new Date(0),
        }
      : {
          code: "__ROOT__",
          dbId: null,
          ownerUserId: null,
          memberId: "__ROOT__",
          round: -1,
          sequence: 0,
          queueOrder: 0,
          placementOrder: 0,
          placedAt: new Date(0),
          completedAt: null,
          isCompleted: false,
          nodeType: "ROOT",
          children: [],
          sortTimestamp: new Date(0),
        };

    openParents.push(rootRecord);

    const getReplayState = (userId) => {
      const key = String(userId);
      if (!userReplayState.has(key)) {
        userReplayState.set(key, {
          completedCount: 0,
          completedByRound: new Map(),
          levelChanges: new Set(),
        });
      }
      return userReplayState.get(key);
    };

    const addPending = (candidate) => {
      pending.push(candidate);
      pending.sort(compareCandidates);
    };

    for (const deposit of deposits) {
      const user = userById.get(String(deposit.userRef));
      if (!user) continue;
      stats.users += 1;

      const baseTimestamp = resolveSortTimestamp(deposit, user, deposit);
      for (const sequence of [1, 2]) {
        const code = generateCode(user.memberId, 0, sequence);
        const existing = existingByCode.get(code) || {};

        addPending({
          code,
          ownerUserId: user._id,
          memberId: user.memberId,
          round: 0,
          sequence,
          queueIndex: sequence,
          sortTimestamp: baseTimestamp,
          source: "initial",
          sourceDepositId: deposit._id,
          existingNode: existing.node || null,
          existingRebirth: existing.rebirth || null,
          sourceParentCode: null,
        });
      }
    }

    let queueOrder = 0;
    let placementOrder = 0;
    let safetyLimit = 0;

    while (pending.length && safetyLimit < 20000) {
      safetyLimit += 1;
      const current = pending.shift();
      if (!current || seenCodes.has(current.code)) {
        if (current && seenCodes.has(current.code)) {
          duplicateCandidates.push(current);
        }
        continue;
      }

      const parent = openParents.slice().sort(compareOpenParents).find((candidate) => (candidate.children || []).length < 3) || null;
      const parentCode = parent && parent.nodeType !== "ROOT" ? parent.code : null;
      const parentDbId = parent && parent.nodeType !== "ROOT" ? parent.dbId || null : null;

      const parentPlacedAt = parent?.placedAt || current.sortTimestamp;
      const placedAt = parent
        ? new Date(Math.max(current.sortTimestamp.getTime(), parentPlacedAt.getTime()) + 1)
        : current.sortTimestamp;

      const record = {
        ...current,
        dbId: current.existingNode?._id || current.existingRebirth?._id || null,
        parentCode,
        parentDbId,
        childSlot: parent ? ((parent.children || []).length + 1) : null,
        queueOrder: queueOrder + 1,
        placementOrder: placementOrder + 1,
        placedAt,
        isCompleted: false,
        completedAt: null,
        children: [],
      };

      queueOrder += 1;
      placementOrder += 1;
      seenCodes.add(record.code);
      replayedByCode.set(record.code, record);
      openParents.push(record);

      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(record);

        if (parent.children.length === 3 && parent.nodeType !== "ROOT") {
          const completionAt = new Date(
            Math.max(...parent.children.map((child) => child.placedAt.getTime())) + 1,
          );
          parent.isCompleted = true;
          parent.completedAt = completionAt;

          const ownerId = parent.ownerUserId;
          if (ownerId) {
            const state = getReplayState(ownerId);
            state.completedCount += 1;
            const roundCompleted = state.completedByRound.get(parent.round) || 0;
            state.completedByRound.set(parent.round, roundCompleted + 1);
          }

          const nextRound = parent.round + 1;
          if (nextRound <= 9 && parent.ownerUserId) {
            const nextSequences = childSequences(parent.sequence);
            let offset = 0;
            for (const nextSequence of nextSequences) {
              const nextCode = generateCode(parent.memberId, nextRound, nextSequence);
              const existing = existingByCode.get(nextCode) || {};

              if (seenCodes.has(nextCode)) {
                duplicateCandidates.push({
                  code: nextCode,
                  ownerUserId: parent.ownerUserId,
                  memberId: parent.memberId,
                  round: nextRound,
                  sequence: nextSequence,
                  sortTimestamp: new Date(completionAt.getTime() + offset + 1),
                  existingNode: existing.node || null,
                  existingRebirth: existing.rebirth || null,
                });
                continue;
              }

              addPending({
                code: nextCode,
                ownerUserId: parent.ownerUserId,
                memberId: parent.memberId,
                round: nextRound,
                sequence: nextSequence,
                queueIndex: nextSequence,
                sortTimestamp: new Date(completionAt.getTime() + offset + 1),
                source: "generated",
                sourceParentCode: parent.code,
                existingNode: existing.node || null,
                existingRebirth: existing.rebirth || null,
              });
              offset += 1;
            }
          }
        }
      }
    }

    const replayedNodes = Array.from(replayedByCode.values()).sort((a, b) => {
      const diff = a.queueOrder - b.queueOrder;
      if (diff !== 0) return diff;
      return String(a.code).localeCompare(String(b.code));
    });

    const perUserSummary = new Map();
    for (const node of replayedNodes) {
      if (!node.ownerUserId) continue;
      const key = String(node.ownerUserId);
      if (!perUserSummary.has(key)) {
        perUserSummary.set(key, {
          userId: node.ownerUserId,
          memberId: node.memberId,
          completedCount: 0,
          completedByRound: new Map(),
          nodes: [],
          placementChanges: [],
          missingRebirths: 0,
          duplicateRebirths: 0,
          fundChanged: false,
          levelChanged: false,
          existingFund: null,
          latestCompletedLevel: null,
          currentActiveLevel: 0,
          fundSummary: calculateAutopoolFundSummary(0),
        });
      }
      perUserSummary.get(key).nodes.push(node);
      if (node.isCompleted) {
        const summary = perUserSummary.get(key);
        summary.completedCount += 1;
        const roundCount = summary.completedByRound.get(node.round) || 0;
        summary.completedByRound.set(node.round, roundCount + 1);
      }
    }

    for (const summary of perUserSummary.values()) {
      const existingFund = await AutopoolUserFund.findOne({ userId: summary.userId }).lean();
      summary.existingFund = existingFund;
      summary.latestCompletedLevel = getCompletedLevelFromCompletedRebirths(summary.completedCount);
      summary.currentActiveLevel = getCurrentActiveLevelFromCompletedRebirths(summary.completedCount);
      summary.fundSummary = calculateAutopoolFundSummary(summary.latestCompletedLevel ?? 0);

      summary.placementChanges = summary.nodes.filter((node) => {
        const existingNode = node.existingNode;
        if (!existingNode) return true;
        return (
          String(existingNode.parentNodeId || existingNode.matrixParentId || "") !== String(node.parentDbId || "") ||
          Number(existingNode.queueIndex || 0) !== Number(node.queueOrder || 0) ||
          Number(existingNode.levelNumber || 0) !== Number(node.round || 0) ||
          Number(existingNode.levelSequence || 0) !== Number(node.sequence || 0) ||
          Boolean(existingNode.isCompleted) !== Boolean(node.isCompleted)
        );
      });

      summary.queueIndexChanges = summary.nodes.filter((node) => {
        const existingNode = node.existingNode;
        return existingNode && Number(existingNode.queueIndex || 0) !== Number(node.queueOrder || 0);
      }).length;

      summary.missingRebirths = summary.nodes.filter((node) => !node.existingRebirth).length;
      summary.duplicateRebirths = duplicateCandidates.filter((candidate) => String(candidate.ownerUserId) === String(summary.userId)).length;
      summary.levelChanged =
        Number(existingFund?.completedAutopoolLevel ?? -1) !== Number(summary.latestCompletedLevel ?? -1) ||
        Number(existingFund?.lastCompletedRound ?? -1) !== Number(summary.latestCompletedLevel ?? -1);
      summary.fundChanged =
        Number(existingFund?.completedAutopoolLevel || 0) !== Number(summary.fundSummary.completedAutopoolLevel || 0) ||
        Number(existingFund?.poolFundTotal || 0) !== Number(summary.fundSummary.poolFundTotal || 0) ||
        Number(existingFund?.reinvestmentFundTotal || 0) !== Number(summary.fundSummary.reinvestmentFundTotal || 0) ||
        Number(existingFund?.withdrawableAutopoolFund || 0) !== Number(summary.fundSummary.withdrawableAutopoolFund || 0) ||
        Number(existingFund?.upgradeIdCount || 0) !== Number(summary.fundSummary.upgradeIdCount || 0);
    }

    stats.placementsChanged = Array.from(perUserSummary.values()).reduce((total, summary) => total + summary.placementChanges.length, 0);
    stats.queueIndexesUpdated = Array.from(perUserSummary.values()).reduce((total, summary) => total + (summary.queueIndexChanges || 0), 0);
    stats.missingRebirths = Array.from(perUserSummary.values()).reduce((total, summary) => total + summary.missingRebirths, 0);
    stats.duplicateRebirths = duplicateCandidates.length;
    stats.usersWithLevelChange = Array.from(perUserSummary.values()).filter((summary) => summary.levelChanged).length;
    stats.usersWithFundChange = Array.from(perUserSummary.values()).filter((summary) => summary.fundChanged).length;

    for (const summary of perUserSummary.values()) {
      const user = userById.get(String(summary.userId));
      if (!user) continue;

      if (dryRun || validateOnly) {
        console.log(`\n[${user.memberId}] replayed ${summary.nodes.length} nodes`);
        if (summary.placementChanges.length) {
          console.log(`  placement changes: ${summary.placementChanges.length}`);
          for (const change of summarizeDifferences(summary.placementChanges)) {
            console.log(
              `    ${change.code} parent=${change.parentCode || "ROOT"} queue=${change.queueOrder} round=${change.round} seq=${change.sequence}`,
            );
          }
        }
        if (summary.duplicateRebirths) {
          console.log(`  duplicate rebirths: ${summary.duplicateRebirths}`);
        }
        if (summary.levelChanged) {
          console.log(
            `  level change: ${summary.existingFund?.completedAutopoolLevel ?? "null"} -> ${summary.latestCompletedLevel ?? "null"}, active=${summary.currentActiveLevel}`,
          );
        }
        if (summary.fundChanged) {
          console.log(
            `  fund recalculation: pool=${summary.fundSummary.poolFundTotal} reinvest=${summary.fundSummary.reinvestmentFundTotal} withdrawable=${summary.fundSummary.withdrawableAutopoolFund} upgrades=${summary.fundSummary.upgradeIdCount}`,
          );
        }
        const dangerousCount = summary.placementChanges.filter((change) => change.existingNode?.isCompleted && !change.isCompleted).length;
        if (dangerousCount) {
          stats.dangerousConflicts += dangerousCount;
          console.log(`  dangerous conflicts: ${dangerousCount}`);
        }
        continue;
      }

      const session = await mongoose.startSession();
      try {
        session.startTransaction({
          readConcern: { level: "snapshot" },
          writeConcern: { w: "majority" },
        });

        for (const node of summary.nodes) {
          const parentDbId = node.parentCode === rootRecord.code ? null : node.parentDbId || null;
          const childIds = (node.children || []).map((child) => child.dbId).filter(Boolean);
          const payload = {
            ownerUserId: summary.userId,
            mainUserId: summary.userId,
            ownerMemberId: user.memberId,
            nodeCode: node.code,
            nodeId: node.code,
            displayCode: node.code,
            rebirthCode: node.code,
            nodeType: "REBIRTH",
            round: node.round,
            sequence: node.sequence,
            levelNumber: node.round,
            levelSequence: node.sequence,
            queueIndex: node.queueOrder,
            queueOrder: node.queueOrder,
            placementOrder: node.placementOrder,
            placedAt: node.placedAt,
            childSlot: node.childSlot,
            parentNodeId: parentDbId,
            matrixParentId: parentDbId,
            status: node.isCompleted ? "COMPLETED" : node.parentCode ? "PLACED" : "PLACED",
            isCompleted: node.isCompleted,
            completedAt: node.completedAt,
            directChildrenCount: childIds.length,
            directChildren: childIds,
            rebirthGenerated: childIds.length === 3,
            rebirthGeneratedAt: childIds.length === 3 ? node.completedAt || null : null,
            generatedFromNodeId: node.parentCode ? replayedByCode.get(node.parentCode)?.dbId || null : null,
            originalCreatedAt: node.sortTimestamp,
            replayedAt: new Date(),
            repairVersion: AUTOPOOL_REPAIR_VERSION,
            isDuplicate: false,
            duplicateOfCode: null,
          };

          const rebirthPayload = {
            ownerUserId: summary.userId,
            ownerMemberId: user.memberId,
            rebirthCode: node.code,
            displayCode: node.code,
            sourceType: node.source === "initial" ? "INITIAL" : "AUTOPool_COMPLETION",
            sequenceNumber: node.sequence,
            generation: node.round,
            mainUserId: summary.userId,
            round: node.round,
            sequence: node.sequence,
            parentRebirthId: node.sourceParentCode ? (replayedByCode.get(node.sourceParentCode)?.dbRebirthId || null) : null,
            sourceParentRebirthId: node.sourceParentCode ? (replayedByCode.get(node.sourceParentCode)?.dbRebirthId || null) : null,
            generatedFromNodeId: node.sourceParentCode ? (replayedByCode.get(node.sourceParentCode)?.dbId || null) : null,
            isInitialRebirth: node.round === 0,
            usedInAutoPool: true,
            status: node.isCompleted ? "COMPLETED" : "PENDING",
            originalCreatedAt: node.sortTimestamp,
            replayedAt: new Date(),
            repairVersion: AUTOPOOL_REPAIR_VERSION,
            seedSource: node.source,
            seedBatchId: node.sourceDepositId ? String(node.sourceDepositId) : null,
            isCompleted: Boolean(node.isCompleted),
            completedAt: node.completedAt,
            isDuplicate: false,
            duplicateOfCode: null,
          };

          const updatedRebirth = await RebirthId.findOneAndUpdate(
            { rebirthCode: node.code },
            { $set: rebirthPayload },
            { upsert: true, new: true, session },
          );

          const updatedNode = await AutoPoolNode.findOneAndUpdate(
            { nodeCode: node.code },
            { $set: payload },
            { upsert: true, new: true, session },
          );

          node.dbId = updatedNode?._id || node.dbId;
          node.dbRebirthId = updatedRebirth?._id || node.dbRebirthId;
        }

        for (const duplicate of duplicateCandidates) {
          if (!duplicate.code) continue;
          await RebirthId.findOneAndUpdate(
            { rebirthCode: duplicate.code },
            {
              $set: {
                isDuplicate: true,
                duplicateOfCode: duplicate.code,
                repairVersion: AUTOPOOL_REPAIR_VERSION,
                replayedAt: new Date(),
              },
            },
            { upsert: false, session },
          ).catch(() => null);

          await AutoPoolNode.findOneAndUpdate(
            { nodeCode: duplicate.code },
            {
              $set: {
                isDuplicate: true,
                duplicateOfCode: duplicate.code,
                repairVersion: AUTOPOOL_REPAIR_VERSION,
                replayedAt: new Date(),
              },
            },
            { upsert: false, session },
          ).catch(() => null);
        }

        const roundEntries = Array.from(new Map(summary.nodes.map((node) => [node.round, node])).keys()).sort((a, b) => a - b);
        for (const round of roundEntries) {
          const expectedNodeCount = roundSize(round);
          const completedNodeCount = summary.nodes.filter((node) => node.round === round && node.isCompleted).length;
          const isCompleted = completedNodeCount >= expectedNodeCount;
          await AutoPoolLevelCompletion.findOneAndUpdate(
            { ownerUserId: summary.userId, levelNumber: round },
            {
              ownerMemberId: user.memberId,
              autoPoolNumber: round + 1,
              expectedNodeCount,
              completedNodeCount,
              isCompleted,
              completedAt: isCompleted ? new Date() : null,
            },
            { upsert: true, new: true, session },
          );
          stats.levelCompletionsUpdated += 1;
        }

        await AutopoolUserFund.findOneAndUpdate(
          { userId: summary.userId },
          {
            $set: {
              completedAutopoolLevel: summary.fundSummary.completedAutopoolLevel,
              poolFundTotal: summary.fundSummary.poolFundTotal,
              reinvestmentFundTotal: summary.fundSummary.reinvestmentFundTotal,
              withdrawableAutopoolFund: summary.fundSummary.withdrawableAutopoolFund,
              upgradeIdCount: summary.fundSummary.upgradeIdCount,
              upgradeDeductionTotal: summary.fundSummary.upgradeDeductionTotal,
              lastCompletedRound: summary.latestCompletedLevel ?? -1,
            },
          },
          { upsert: true, new: true, session },
        );
        stats.fundSummariesUpdated += 1;

        await User.updateOne(
          { _id: summary.userId },
          {
            $set: {
              currentCompletedAutopoolRound: summary.latestCompletedLevel ?? -1,
            },
            $addToSet: { processedAutopoolRounds: { $each: roundEntries } },
          },
          { session },
        );

        await session.commitTransaction();
      } catch (error) {
        await session.abortTransaction().catch(() => null);
        throw error;
      } finally {
        session.endSession();
      }
    }

    console.log("\n==================================================");
    console.log(`Users inspected: ${stats.users}`);
    console.log(`Placements changed: ${stats.placementsChanged}`);
    console.log(`Missing rebirths: ${stats.missingRebirths}`);
    console.log(`Duplicate rebirths: ${stats.duplicateRebirths}`);
    console.log(`Users with level change: ${stats.usersWithLevelChange}`);
    console.log(`Users with fund change: ${stats.usersWithFundChange}`);
    console.log(`Dangerous conflicts: ${stats.dangerousConflicts}`);
    console.log(`Queue indexes updated: ${stats.queueIndexesUpdated}`);
    console.log(`Level completions updated: ${stats.levelCompletionsUpdated}`);
    console.log(`Fund summaries updated: ${stats.fundSummariesUpdated}`);
    console.log("==================================================");
  } finally {
    await releaseAutopoolRepairLock({ lockedBy: actor }).catch(() => null);
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error("Chronological AutoPool replay repair failed:", error);
  process.exitCode = 1;
});
