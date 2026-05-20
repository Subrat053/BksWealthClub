import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { User } from "../modules/user/user.model.js";
import { AutoPoolNode } from "../modules/autopool/autopool-matrix.model.js";
import { RebirthId } from "../modules/autopool/rebirth.model.js";
import { AutoPoolLevelCompletion } from "../modules/autopool/autopool-level-completion.model.js";
import { AutopoolUserFund } from "../modules/autopool/autopool-user-fund.model.js";
import { PoolFundLedger } from "../modules/autopool/pool-fund-ledger.model.js";
import { UpgradeAliasId } from "../modules/autopool/upgrade-alias-id.model.js";
import {
  calculateAutopoolFundSummary,
  getCompletedLevelFromCompletedRebirths,
  getCurrentActiveLevelFromCompletedRebirths,
  generateRebirthCode,
} from "../modules/autopool/autopool-3x3.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../../.env") });

const isTruthyFlag = (value) => value === true || value === "true" || value === "1";

const args = process.argv.slice(2);
const flags = new Set(args.filter((arg) => arg.startsWith("--")));
const applyMode = flags.has("--apply");
const dryRun = flags.has("--dry-run") || !applyMode;
const recalculateFundsOnly = flags.has("--recalculate-funds");
const refreshSummariesOnly = flags.has("--refresh-summaries");

function roundPow(level) {
  return Math.pow(2, level + 1);
}

function buildRoundGroups(nodes) {
  const groups = [];
  let cursor = 0;
  let level = 0;

  while (cursor < nodes.length && level < 10) {
    const expectedCount = roundPow(level);
    const slice = nodes.slice(cursor, cursor + expectedCount);
    groups.push({ level, expectedCount, nodes: slice });
    cursor += slice.length;
    level += 1;
  }

  return groups;
}

function getRoundChildrenSequences(sequence) {
  return [2 * sequence - 1, 2 * sequence];
}

function formatDisplayCode(memberId, level, sequence) {
  return generateRebirthCode({ memberId, level, sequence });
}

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is missing");
  }

  console.log("==================================================");
  console.log("AutoPool state repair");
  console.log(`Mode: ${dryRun ? "dry-run" : "apply"}`);
  if (recalculateFundsOnly) console.log("Scope: recalculating funds only");
  if (refreshSummariesOnly) console.log("Scope: refreshing summaries only");
  console.log("==================================================");

  await mongoose.connect(process.env.MONGODB_URI);

  const users = await User.find({})
    .select("memberId fullName createdAt currentCompletedAutopoolRound processedAutopoolRounds")
    .sort({ createdAt: 1, _id: 1 })
    .lean();

  let repairedUsers = 0;
  let createdNodes = 0;
  let updatedNodes = 0;
  let updatedLevelCompletions = 0;
  let updatedFunds = 0;
  let updatedQueueIndexes = 0;

  for (const user of users) {
    const rebirthNodes = await AutoPoolNode.find({ ownerUserId: user._id, nodeType: "REBIRTH" })
      .sort({ createdAt: 1, queueIndex: 1, _id: 1 })
      .lean();

    if (rebirthNodes.length === 0) continue;

    repairedUsers += 1;
    console.log(`\n[${user.memberId}] inspecting ${rebirthNodes.length} rebirth nodes`);

    const completedCount = rebirthNodes.filter((node) => node.status === "COMPLETED").length;
    const latestCompletedLevel = getCompletedLevelFromCompletedRebirths(completedCount);
    const currentActiveLevel = getCurrentActiveLevelFromCompletedRebirths(completedCount);
    const fundSummary = calculateAutopoolFundSummary(latestCompletedLevel ?? 0);

    const roundGroups = buildRoundGroups(rebirthNodes);
    const nodeByCode = new Map(rebirthNodes.map((node) => [node.nodeCode, node]));
    const rebirthByCode = new Map();
    const rebirthDocs = await RebirthId.find({ ownerUserId: user._id }).lean();
    for (const doc of rebirthDocs) {
      rebirthByCode.set(doc.displayCode || doc.rebirthCode, doc);
    }

    for (const group of roundGroups) {
      for (let index = 0; index < group.nodes.length; index += 1) {
        const node = group.nodes[index];
        const normalizedSequence = index + 1;
        const queueIndex = normalizedSequence;

        if (node.queueIndex !== queueIndex && (applyMode || dryRun)) {
          console.log(
            `[${user.memberId}] queueIndex ${node.nodeCode}: ${node.queueIndex ?? "null"} -> ${queueIndex}`,
          );
          updatedQueueIndexes += 1;
        }

        const parentRebirthDoc = rebirthByCode.get(node.nodeCode) || null;
        const ensuredChildIds = [];

        if (node.status === "COMPLETED") {
          const nextLevel = group.level + 1;
          if (nextLevel > 9) continue;

          const childSequences = getRoundChildrenSequences(normalizedSequence);
          for (const childSequence of childSequences) {
            const childDisplayCode = formatDisplayCode(user.memberId, nextLevel, childSequence);
            const existingNode = nodeByCode.get(childDisplayCode);
            const existingRebirth = rebirthByCode.get(childDisplayCode);

            if (existingNode) {
              ensuredChildIds.push(existingNode._id);
              const shouldUpdateNode =
                existingNode.ownerUserId?.toString?.() !== user._id.toString() ||
                existingNode.generatedFromNodeId?.toString?.() !== node._id.toString() ||
                existingNode.queueIndex !== childSequence ||
                existingNode.queueTimestamp == null;

              if (shouldUpdateNode) {
                console.log(`[${user.memberId}] syncing existing node ${childDisplayCode}`);
                if (!dryRun) {
                  await AutoPoolNode.updateOne(
                    { _id: existingNode._id },
                    {
                      $set: {
                        ownerUserId: user._id,
                        ownerMemberId: user.memberId,
                        nodeCode: childDisplayCode,
                        displayCode: childDisplayCode,
                        nodeId: childDisplayCode,
                        nodeType: "REBIRTH",
                        rebirthCode: childDisplayCode,
                        rebirthId: existingRebirth?._id || existingNode.rebirthId || null,
                        generatedFromNodeId: node._id,
                        matrixParentId: node._id,
                        parentNodeId: node._id,
                        levelNumber: nextLevel,
                        levelSequence: childSequence,
                        queueIndex: childSequence,
                        queueTimestamp: node.completedAt || node.createdAt || existingNode.queueTimestamp || new Date(),
                        status: existingNode.status || "PENDING",
                      },
                    },
                  );
                }
                updatedNodes += 1;
              }
              continue;
            }

            console.log(`[${user.memberId}] missing child ${childDisplayCode} will be created`);
            if (!dryRun) {
              const rebirthParentId = parentRebirthDoc?._id || null;
              const rebirthDocResult =
                existingRebirth ||
                (await RebirthId.create({
                  ownerUserId: user._id,
                  ownerMemberId: user.memberId,
                  rebirthCode: childDisplayCode,
                  displayCode: childDisplayCode,
                  sourceType: "AUTOPool_COMPLETION",
                  sequenceNumber: childSequence,
                  generation: nextLevel,
                  parentRebirthId: rebirthParentId,
                  generatedFromNodeId: node._id,
                  isInitialRebirth: false,
                  usedInAutoPool: true,
                  status: "PENDING",
                  levelNumber: nextLevel,
                  levelSequence: childSequence,
                }));

              const createdNode = await AutoPoolNode.create({
                ownerUserId: user._id,
                ownerMemberId: user.memberId,
                nodeCode: childDisplayCode,
                displayCode: childDisplayCode,
                nodeId: childDisplayCode,
                nodeType: "REBIRTH",
                rebirthId: rebirthDocResult._id || rebirthDocResult?.[0]?._id,
                rebirthCode: childDisplayCode,
                generatedFromNodeId: node._id,
                levelNumber: nextLevel,
                levelSequence: childSequence,
                queueIndex: childSequence,
                queueTimestamp: node.completedAt || node.createdAt || new Date(),
                status: "PENDING",
                matrixParentId: node._id,
                parentNodeId: node._id,
              });

              nodeByCode.set(childDisplayCode, createdNode);
              rebirthByCode.set(childDisplayCode, rebirthDocResult);
              createdNodes += 1;
              ensuredChildIds.push(createdNode._id);
            }
          }

          if (!dryRun) {
            await AutoPoolNode.updateOne(
              { _id: node._id },
              {
                $set: {
                  queueIndex,
                  rebirthGenerated: true,
                  rebirthGeneratedAt: node.rebirthGeneratedAt || node.completedAt || new Date(),
                  directChildren: ensuredChildIds,
                  directChildrenCount: ensuredChildIds.length,
                },
              },
            );
          }
        } else if (node.queueIndex !== queueIndex && !dryRun) {
          await AutoPoolNode.updateOne({ _id: node._id }, { $set: { queueIndex } });
        }
      }
    }

    const levelNodeMap = new Map(roundGroups.map((group) => [group.level, group.nodes]));
    const expectedLevelRecords = latestCompletedLevel === null ? [] : Array.from({ length: latestCompletedLevel + 1 }, (_, level) => level);

    for (const level of expectedLevelRecords) {
      const expectedNodeCount = roundPow(level);
      const levelNodes = levelNodeMap.get(level) || [];
      const levelCompletedCount = levelNodes.filter((node) => node.status === "COMPLETED").length;
      const levelComplete = level <= latestCompletedLevel;

      console.log(
        `[${user.memberId}] level ${level}: expected ${expectedNodeCount}, completed ${levelCompletedCount}, complete=${levelComplete}`,
      );

      if (!dryRun) {
        await AutoPoolLevelCompletion.findOneAndUpdate(
          { ownerUserId: user._id, levelNumber: level },
          {
            ownerMemberId: user.memberId,
            autoPoolNumber: level + 1,
            expectedNodeCount,
            completedNodeCount: levelCompletedCount,
            isCompleted: levelComplete,
            completedAt: levelComplete ? new Date() : null,
          },
          { upsert: true, new: true },
        );
        updatedLevelCompletions += 1;
      }
    }

    if (!recalculateFundsOnly && !refreshSummariesOnly) {
      const ledgerAgg = await PoolFundLedger.aggregate([
        { $match: { mainUserId: user._id } },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ]);

      const ledgerTotal = ledgerAgg[0]?.total || 0;
      if (ledgerTotal !== fundSummary.poolFundTotal) {
        console.log(
          `[${user.memberId}] fund summary differs from legacy ledger: ledger=${ledgerTotal}, calculated=${fundSummary.poolFundTotal}`,
        );
      }
    }

    if (!dryRun) {
      await AutopoolUserFund.findOneAndUpdate(
        { userId: user._id },
        {
          $set: {
            completedAutopoolLevel: latestCompletedLevel ?? 0,
            poolFundTotal: fundSummary.poolFundTotal,
            reinvestmentFundTotal: fundSummary.reinvestmentFundTotal,
            withdrawableAutopoolFund: fundSummary.withdrawableAutopoolFund,
            upgradeIdCount: fundSummary.upgradeIdCount,
            upgradeDeductionTotal: fundSummary.upgradeDeductionTotal,
            lastCompletedRound: latestCompletedLevel ?? -1,
          },
        },
        { upsert: true, new: true },
      );
      updatedFunds += 1;

      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            currentCompletedAutopoolRound: latestCompletedLevel ?? -1,
          },
          $addToSet: { processedAutopoolRounds: { $each: expectedLevelRecords } },
        },
      );
    }

    if (latestCompletedLevel !== null) {
      console.log(
        `[${user.memberId}] completedRebirths=${completedCount}, latestCompletedLevel=${latestCompletedLevel}, currentActiveLevel=${currentActiveLevel}`,
      );
    } else {
      console.log(`[${user.memberId}] no completed level yet`);
    }

    const upgradeIds = await UpgradeAliasId.find({ userId: user._id }).lean();
    if (upgradeIds.length > 0) {
      console.log(`[${user.memberId}] upgrade IDs already present: ${upgradeIds.length}`);
    }
  }

  console.log("\n==================================================");
  console.log(`Users inspected: ${repairedUsers}`);
  console.log(`Nodes created: ${createdNodes}`);
  console.log(`Nodes updated: ${updatedNodes}`);
  console.log(`Queue indexes updated: ${updatedQueueIndexes}`);
  console.log(`Level completions updated: ${updatedLevelCompletions}`);
  console.log(`Fund summaries updated: ${updatedFunds}`);
  console.log("==================================================");

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error("AutoPool state repair failed:", error);
  process.exitCode = 1;
});