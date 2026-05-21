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
import { AutopoolFundTransaction } from "../modules/autopool/autopool-fund-transaction.model.js";
import { UpgradeAliasId } from "../modules/autopool/upgrade-alias-id.model.js";
import {
  calculateAutopoolFundSummary,
  getCompletedLevelFromCompletedRebirths,
} from "../modules/autopool/autopool-3x3.service.js";
import {
  acquireAutopoolRepairLock,
  releaseAutopoolRepairLock,
  AUTOPOOL_REPAIR_VERSION,
  AUTOPOOL_REPAIR_LOCK_KEY,
} from "../modules/autopool/autopool-repair-lock.service.js";
import { AutopoolRepairLock } from "../modules/autopool/autopool-repair-lock.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env configuration
dotenv.config({ path: path.join(__dirname, "../../.env") });

const args = process.argv.slice(2);
const flags = new Set(args.filter((arg) => arg.startsWith("--")));
const applyMode = flags.has("--apply");
const dryRun = flags.has("--dry-run") || !applyMode;
const repairLabel = "root-queue-replay";
const actor = `script:${repairLabel}`;

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is missing");
  }

  console.log("==================================================");
  console.log(" Chronological 3x3 AutoPool Root & Queue Replay Repair");
  console.log(` Mode: ${dryRun ? "DRY-RUN (Read-Only)" : "APPLY (Commit Changes)"}`);
  console.log(` Repair Version: ${AUTOPOOL_REPAIR_VERSION}`);
  console.log("==================================================");

  console.log("[AutoPool Repair] Connecting to database...");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("[AutoPool Repair] Database connected successfully.");

  // Force unlock any prior stale lock from seeding/replay
  await AutopoolRepairLock.findOneAndUpdate(
    { key: AUTOPOOL_REPAIR_LOCK_KEY, lockedBy: { $in: ["script:seed-lock", "script:chronological-replay"] } },
    { $set: { isLocked: false, releasedAt: new Date() } }
  );

  // Acquire repair lock
  const lock = await acquireAutopoolRepairLock({
    lockedBy: actor,
    mode: dryRun ? "dry-run" : "apply",
  });

  if (!lock) {
    throw new Error("Unable to acquire autopool repair lock. Is another process running or lock stale?");
  }

  console.log("[AutoPool Repair] Repair lock acquired.");

  try {
    // ─── 1. FETCH ALL USERS & DEPOSITS ───────────────────────────────────
    const users = await User.find({}).sort({ createdAt: 1, _id: 1 }).lean();
    const userMap = new Map(users.map((u) => [String(u._id), u]));
    const userByMemberId = new Map(users.map((u) => [u.memberId, u]));

    const adminUser = userByMemberId.get("BKS000000");
    if (!adminUser) {
      throw new Error("Main Admin User BKS000000 not found in database! Seeding must be incomplete.");
    }

    const deposits = await DepositModel.find({ status: "approved" })
      .sort({ createdAt: 1, _id: 1 })
      .lean();

    // Map each user to their oldest approved deposit
    const userToDepositMap = new Map();
    for (const d of deposits) {
      if (!userToDepositMap.has(String(d.userRef))) {
        userToDepositMap.set(String(d.userRef), d);
      }
    }

    // Determine active users who need initial rebirths
    const activeUsers = users.filter((u) => {
      if (u.memberId === "BKS000000") return false; // Admin root handled separately
      return (
        u.status === "active" ||
        u.activationStatus === "ACTIVE" ||
        userToDepositMap.has(String(u._id))
      );
    });

    console.log(`[AutoPool Repair] Found ${users.length} total users, ${activeUsers.length} active users, and ${deposits.length} approved deposits.`);

    // ─── 2. SEED INITIAL QUEUE & ADMIN ROOT ──────────────────────────────
    console.log("[AutoPool Repair] Initializing Chronological Queue...");

    // The sole system root node
    const rootNodeCode = "BKS000000-0.1";
    const rootNode = {
      nodeCode: rootNodeCode,
      displayCode: rootNodeCode,
      ownerMemberId: "BKS000000",
      ownerUserId: adminUser._id,
      nodeType: "ROOT",
      rebirthType: "DEPOSIT_REBIRTH",
      levelNumber: 0,
      levelSequence: 1,
      status: "PLACED",
      isRoot: true,
      parentNodeId: null,
      matrixParentId: null,
      queueSerialNo: 1,
      placementSerialNo: 1,
      placedAt: new Date("2000-01-01T00:00:00Z"),
      queueEnteredAt: new Date("2000-01-01T00:00:00Z"),
      originalCreatedAt: new Date("2000-01-01T00:00:00Z"),
      isActiveInAutopool: true,
      directChildren: [],
      directChildrenCount: 0,
      rebirthGenerated: false,
    };

    const replayedNodesMap = new Map();
    replayedNodesMap.set(rootNodeCode, rootNode);

    // Initial pending nodes to be enqueued chronologically
    const initialQueue = [];

    // Admin's second initial rebirth node
    initialQueue.push({
      nodeCode: "BKS000000-0.2",
      displayCode: "BKS000000-0.2",
      ownerMemberId: "BKS000000",
      ownerUserId: adminUser._id,
      nodeType: "REBIRTH",
      rebirthType: "DEPOSIT_REBIRTH",
      levelNumber: 0,
      levelSequence: 2,
      status: "PENDING",
      queueEnteredAt: new Date("2000-01-01T00:00:05Z"),
      originalCreatedAt: new Date("2000-01-01T00:00:05Z"),
    });

    // Populate other active users' initial rebirths
    for (const user of activeUsers) {
      const deposit = userToDepositMap.get(String(user._id));
      const sortTimestamp = deposit
        ? new Date(deposit.createdAt)
        : new Date(user.activatedAt || user.createdAt);

      initialQueue.push({
        nodeCode: `${user.memberId}-0.1`,
        displayCode: `${user.memberId}-0.1`,
        ownerMemberId: user.memberId,
        ownerUserId: user._id,
        nodeType: "REBIRTH",
        rebirthType: "DEPOSIT_REBIRTH",
        levelNumber: 0,
        levelSequence: 1,
        status: "PENDING",
        queueEnteredAt: sortTimestamp,
        originalCreatedAt: sortTimestamp,
      });

      initialQueue.push({
        nodeCode: `${user.memberId}-0.2`,
        displayCode: `${user.memberId}-0.2`,
        ownerMemberId: user.memberId,
        ownerUserId: user._id,
        nodeType: "REBIRTH",
        rebirthType: "DEPOSIT_REBIRTH",
        levelNumber: 0,
        levelSequence: 2,
        status: "PENDING",
        queueEnteredAt: new Date(sortTimestamp.getTime() + 1000), // Enqueued 1 second later
        originalCreatedAt: sortTimestamp,
      });
    }

    // Sort initial queue chronologically
    initialQueue.sort((a, b) => {
      const diffTime = a.queueEnteredAt.getTime() - b.queueEnteredAt.getTime();
      if (diffTime !== 0) return diffTime;
      const diffSeq = a.levelSequence - b.levelSequence;
      if (diffSeq !== 0) return diffSeq;
      return a.ownerMemberId.localeCompare(b.ownerMemberId);
    });

    // ─── 3. SIMULATE CHRONOLOGICAL PLACEMENTS ────────────────────────────
    console.log("[AutoPool Repair] Simulating 3x3 chronological placement tree...");

    const pendingQueue = [...initialQueue];
    const placedNodesList = [rootNode];

    let nextQueueSerialNo = 2; // Root BKS000000-0.1 gets serial number 1
    let nextPlacementSerialNo = 2;

    // Assign replayed queue serials to initial queue
    for (const node of pendingQueue) {
      node.queueSerialNo = nextQueueSerialNo++;
    }

    let safetyCount = 0;
    while (pendingQueue.length > 0 && safetyCount < 100000) {
      safetyCount++;
      const current = pendingQueue.shift();

      // Find oldest active placed node with capacity (< 3 children)
      const parent = placedNodesList
        .filter((n) => n.status === "PLACED" && n.directChildrenCount < 3)
        .sort((a, b) => a.queueSerialNo - b.queueSerialNo)[0];

      if (!parent) {
        console.error(`[AutoPool Repair] FATAL: No available parent for node ${current.nodeCode}. Matrix is broken.`);
        break;
      }

      // Place current node under selected parent
      current.status = "PLACED";
      current.parentNodeId = parent.nodeCode;
      current.matrixParentId = parent.nodeCode;
      current.childSlot = parent.directChildrenCount + 1;
      current.placementSerialNo = nextPlacementSerialNo++;
      current.placedAt = new Date(Math.max(current.queueEnteredAt.getTime(), parent.placedAt.getTime()) + 1000); // 1s placement gap
      current.directChildren = [];
      current.directChildrenCount = 0;

      parent.directChildren.push(current.nodeCode);
      parent.directChildrenCount++;

      placedNodesList.push(current);
      replayedNodesMap.set(current.nodeCode, current);

      // Parent completed check
      if (parent.directChildrenCount === 3) {
        parent.status = "COMPLETED";
        parent.completedAt = current.placedAt;

        // Generate next level rebirths only for REBIRTH type parent nodes
        if (parent.nodeType === "REBIRTH") {
          parent.rebirthGenerated = true;
          parent.rebirthGeneratedAt = parent.completedAt;

          const nextLevel = parent.levelNumber + 1;
          if (nextLevel <= 9) {
            const nextSequences = [2 * parent.levelSequence - 1, 2 * parent.levelSequence];

            for (let idx = 0; idx < nextSequences.length; idx++) {
              const seq = nextSequences[idx];
              const displayCode = `${parent.ownerMemberId}-${nextLevel}.${seq}`;

              const nextRebirth = {
                nodeCode: displayCode,
                displayCode: displayCode,
                ownerMemberId: parent.ownerMemberId,
                ownerUserId: parent.ownerUserId,
                nodeType: "REBIRTH",
                rebirthType: "AUTOPOOL_GENERATED_REBIRTH",
                levelNumber: nextLevel,
                levelSequence: seq,
                status: "PENDING",
                queueEnteredAt: new Date(parent.completedAt.getTime() + (idx + 1) * 1000), // Enqueue with offset
                originalCreatedAt: parent.completedAt,
                queueSerialNo: nextQueueSerialNo++,
              };

              pendingQueue.push(nextRebirth);
            }

            // Re-sort queue to maintain strict chronological enqueued FIFO order
            pendingQueue.sort((a, b) => {
              const diffTime = a.queueEnteredAt.getTime() - b.queueEnteredAt.getTime();
              if (diffTime !== 0) return diffTime;
              return a.queueSerialNo - b.queueSerialNo;
            });
          }
        }
      }
    }

    console.log(`[AutoPool Repair] Simulation complete. Placed total of ${placedNodesList.length} nodes in clean tree.`);

    // ─── 4. COMPARE WITH EXISTING DB RECORDS & DETECT ORPHANS ───────────
    console.log("[AutoPool Repair] Auditing database records against simulation...");

    const dbNodes = await AutoPoolNode.find({}).lean();
    const dbNodeByCode = new Map(dbNodes.map((n) => [n.nodeCode, n]));

    const dbRebirths = await RebirthId.find({}).lean();
    const dbRebirthByCode = new Map(dbRebirths.map((r) => [r.rebirthCode, r]));

    const nodesToInsert = [];
    const nodesToUpdate = [];
    const nodesToOrphan = [];

    // Identify updates and inserts
    for (const simNode of placedNodesList) {
      const dbNode = dbNodeByCode.get(simNode.nodeCode);
      const dbRebirth = dbRebirthByCode.get(simNode.nodeCode);

      // Determine parent DB IDs for replayed parent references
      let parentDbId = null;
      if (simNode.parentNodeId) {
        const parentSimNode = replayedNodesMap.get(simNode.parentNodeId);
        // Find existing parent's _id from DB, or we resolve it during updates
        const parentDbNode = dbNodeByCode.get(simNode.parentNodeId);
        if (parentDbNode) {
          parentDbId = parentDbNode._id;
        }
      }

      const isCompleted = simNode.status === "COMPLETED";

      const payload = {
        ownerUserId: simNode.ownerUserId,
        nodeCode: simNode.nodeCode,
        displayCode: simNode.displayCode,
        nodeId: simNode.nodeCode,
        nodeType: simNode.nodeType,
        rebirthType: simNode.rebirthType,
        levelNumber: simNode.levelNumber,
        levelSequence: simNode.levelSequence,
        status: simNode.status,
        isRoot: simNode.isRoot || false,
        parentNodeId: parentDbId,
        matrixParentId: parentDbId,
        childSlot: simNode.childSlot || null,
        queueSerialNo: simNode.queueSerialNo,
        placementSerialNo: simNode.placementSerialNo || null,
        placedAt: simNode.placedAt || null,
        queueEnteredAt: simNode.queueEnteredAt,
        originalCreatedAt: simNode.originalCreatedAt,
        isPlaced: simNode.status !== "PENDING",
        isCompleted,
        completedAt: isCompleted ? simNode.completedAt : null,
        directChildrenCount: simNode.directChildrenCount,
        directChildrenCodes: simNode.directChildren, // Temp field for resolving children IDs
        rebirthGenerated: simNode.rebirthGenerated || false,
        rebirthGeneratedAt: simNode.rebirthGeneratedAt || null,
        isActiveInAutopool: true,
        repairStatus: "REPAIRED",
        repairBatchId: AUTOPOOL_REPAIR_VERSION,
      };

      const rebirthPayload = {
        ownerUserId: simNode.ownerUserId,
        ownerMemberId: simNode.ownerMemberId,
        rebirthCode: simNode.nodeCode,
        displayCode: simNode.displayCode,
        sourceType: simNode.rebirthType === "DEPOSIT_REBIRTH" ? "INITIAL" : "AUTOPool_COMPLETION",
        rebirthType: simNode.rebirthType,
        sequenceNumber: simNode.levelSequence,
        generation: simNode.levelNumber,
        levelNumber: simNode.levelNumber,
        levelSequence: simNode.levelSequence,
        isInitialRebirth: simNode.levelNumber === 0,
        usedInAutoPool: true,
        status: simNode.status,
        queueSerialNo: simNode.queueSerialNo,
        queueEnteredAt: simNode.queueEnteredAt,
        placementSerialNo: simNode.placementSerialNo || null,
        placedAt: simNode.placedAt || null,
        isPlaced: simNode.status !== "PENDING",
        parentNodeId: parentDbId,
        childSlot: simNode.childSlot || null,
        isActiveInAutopool: true,
        repairStatus: "REPAIRED",
        repairBatchId: AUTOPOOL_REPAIR_VERSION,
        isCompleted,
        completedAt: isCompleted ? simNode.completedAt : null,
      };

      if (!dbNode) {
        nodesToInsert.push({ nodeCode: simNode.nodeCode, payload, rebirthPayload });
      } else {
        // Detect mismatch
        const isMismatch =
          dbNode.status !== simNode.status ||
          dbNode.directChildrenCount !== simNode.directChildrenCount ||
          dbNode.queueSerialNo !== simNode.queueSerialNo ||
          dbNode.placementSerialNo !== simNode.placementSerialNo ||
          dbNode.childSlot !== simNode.childSlot ||
          String(dbNode.parentNodeId || "") !== String(parentDbId || "") ||
          dbNode.isActiveInAutopool !== true;

        if (isMismatch) {
          nodesToUpdate.push({ nodeCode: simNode.nodeCode, dbNodeId: dbNode._id, dbRebirthId: dbRebirth?._id, payload, rebirthPayload });
        }
      }
    }

    // Identify orphans (exists in DB but NOT in replayed simulation tree)
    for (const dbNode of dbNodes) {
      if (!replayedNodesMap.has(dbNode.nodeCode)) {
        nodesToOrphan.push(dbNode);
      }
    }

    console.log(`[AutoPool Repair] Mismatch stats:`);
    console.log(`  - New nodes to insert: ${nodesToInsert.length}`);
    console.log(`  - Incorrect nodes to repair/update: ${nodesToUpdate.length}`);
    console.log(`  - Orphaned legacy/invalid nodes to deactivate: ${nodesToOrphan.length}`);

    // ─── 5. EXECUTE DATABASE REPAIRS (IF --apply) ──────────────────────────
    if (dryRun) {
      console.log("[AutoPool Repair] DRY-RUN MODE: Skipping database writes.");
    } else {
      console.log("[AutoPool Repair] APPLY MODE: Committing tree updates to DB...");

      // A. Seed/Correct Missing nodes & RebirthIds
      for (const item of nodesToInsert) {
        console.log(`  [INSERT] Creating missing node/rebirth: ${item.nodeCode}`);
        const rebirthDoc = await RebirthId.findOneAndUpdate(
          { rebirthCode: item.nodeCode },
          { $set: item.rebirthPayload },
          { upsert: true, new: true }
        );

        const nodePayload = { ...item.payload, rebirthId: rebirthDoc._id };
        await AutoPoolNode.findOneAndUpdate(
          { nodeCode: item.nodeCode },
          { $set: nodePayload },
          { upsert: true, new: true }
        );
      }

      // B. Repair mismatched nodes
      for (const item of nodesToUpdate) {
        console.log(`  [REPAIR] Correcting mismatched node/rebirth: ${item.nodeCode}`);
        if (item.dbRebirthId) {
          await RebirthId.findByIdAndUpdate(item.dbRebirthId, { $set: item.rebirthPayload });
        } else {
          await RebirthId.findOneAndUpdate({ rebirthCode: item.nodeCode }, { $set: item.rebirthPayload }, { upsert: true });
        }

        await AutoPoolNode.findByIdAndUpdate(item.dbNodeId, { $set: item.payload });
      }

      // C. Orphan stale records (Set isActiveInAutopool: false, repairStatus: "ORPHANED")
      for (const item of nodesToOrphan) {
        console.log(`  [ORPHAN] Deactivating stale node: ${item.nodeCode} (${item.nodeType})`);
        await AutoPoolNode.findByIdAndUpdate(item._id, {
          $set: { isActiveInAutopool: false, repairStatus: "ORPHANED", repairBatchId: AUTOPOOL_REPAIR_VERSION },
        });

        if (item.rebirthId) {
          await RebirthId.findByIdAndUpdate(item.rebirthId, {
            $set: { isActiveInAutopool: false, repairStatus: "ORPHANED", repairBatchId: AUTOPOOL_REPAIR_VERSION },
          });
        } else {
          await RebirthId.updateMany(
            { rebirthCode: item.nodeCode },
            { $set: { isActiveInAutopool: false, repairStatus: "ORPHANED", repairBatchId: AUTOPOOL_REPAIR_VERSION } }
          );
        }
      }

      // D. Resolve Direct Children database references (since some children were just inserted/updated)
      console.log("[AutoPool Repair] Resolving parent-child relations with accurate database ObjectIds...");
      const finalDbNodes = await AutoPoolNode.find({ isActiveInAutopool: true }).lean();
      const finalDbNodeByCode = new Map(finalDbNodes.map((n) => [n.nodeCode, n]));

      for (const nodeCode of replayedNodesMap.keys()) {
        const simNode = replayedNodesMap.get(nodeCode);
        const dbNode = finalDbNodeByCode.get(nodeCode);
        if (!dbNode) continue;

        const childDbIds = simNode.directChildren
          .map((childCode) => finalDbNodeByCode.get(childCode)?._id)
          .filter(Boolean);

        let parentDbId = null;
        if (simNode.parentNodeId) {
          parentDbId = finalDbNodeByCode.get(simNode.parentNodeId)?._id || null;
        }

        await AutoPoolNode.updateOne(
          { _id: dbNode._id },
          {
            $set: {
              directChildren: childDbIds,
              parentNodeId: parentDbId,
              matrixParentId: parentDbId,
            },
          }
        );

        if (dbNode.rebirthId) {
          await RebirthId.updateOne(
            { _id: dbNode.rebirthId },
            { $set: { parentNodeId: parentDbId } }
          );
        }
      }
      console.log("[AutoPool Repair] Parent-child database mapping verified and updated.");
    }

    // ─── 6. BALANCE RECONCILIATION & TRANS ACTIONS ───────────────────────
    console.log("[AutoPool Repair] Reconciling level completions and fund wallets...");

    const userStats = {
      inspected: 0,
      completionRecordUpdates: 0,
      fundWalletAdjustments: 0,
    };

    for (const user of users) {
      userStats.inspected++;
      const userId = user._id;

      // Calculate replayed completed count
      const replayedCompletedNodes = placedNodesList.filter(
        (n) => String(n.ownerUserId) === String(userId) && n.status === "COMPLETED"
      );
      const replayedCompletedCount = replayedCompletedNodes.length;

      // Determine correct latest completed level
      const latestCompletedLevel = getCompletedLevelFromCompletedRebirths(replayedCompletedCount);
      const targetLevel = latestCompletedLevel !== null ? latestCompletedLevel : -1;

      // Compute correct replayed fund values
      const correctFundSummary = calculateAutopoolFundSummary(latestCompletedLevel ?? 0);

      // Verify AutoPoolLevelCompletion progress records for levels 0 to 9
      for (let round = 0; round <= 9; round++) {
        const expectedNodeCount = Math.pow(2, round + 1);
        const completedNodeCount = replayedCompletedNodes.filter((n) => n.levelNumber === round).length;
        const isCompleted = completedNodeCount >= expectedNodeCount;

        const dbCompletion = await AutoPoolLevelCompletion.findOne({ ownerUserId: userId, levelNumber: round });

        const needsCompletionUpdate =
          !dbCompletion ||
          dbCompletion.completedNodeCount !== completedNodeCount ||
          dbCompletion.isCompleted !== isCompleted;

        if (needsCompletionUpdate) {
          userStats.completionRecordUpdates++;
          if (!dryRun) {
            await AutoPoolLevelCompletion.findOneAndUpdate(
              { ownerUserId: userId, levelNumber: round },
              {
                ownerMemberId: user.memberId,
                autoPoolNumber: round + 1,
                expectedNodeCount,
                completedNodeCount,
                isCompleted,
                completedAt: isCompleted ? (dbCompletion?.completedAt || new Date()) : null,
              },
              { upsert: true }
            );
          }
        }
      }

      // Verify user's AutopoolUserFund record
      const dbFund = await AutopoolUserFund.findOne({ userId });

      const withdrawableDiff = correctFundSummary.withdrawableAutopoolFund - (dbFund?.withdrawableAutopoolFund || 0);
      const poolDiff = correctFundSummary.poolFundTotal - (dbFund?.poolFundTotal || 0);
      const reinvestmentDiff = correctFundSummary.reinvestmentFundTotal - (dbFund?.reinvestmentFundTotal || 0);

      const hasFundDiff =
        withdrawableDiff !== 0 ||
        poolDiff !== 0 ||
        reinvestmentDiff !== 0 ||
        (dbFund?.completedAutopoolLevel || 0) !== correctFundSummary.completedAutopoolLevel ||
        (dbFund?.lastCompletedRound || -1) !== targetLevel;

      if (hasFundDiff) {
        userStats.fundWalletAdjustments++;
        console.log(`  [BALANCE RECONCILE] User ${user.memberId}:`);
        console.log(`    - Completed Round: DB=${dbFund?.lastCompletedRound ?? -1} -> Sim=${targetLevel}`);
        console.log(`    - Withdrawable: DB=${dbFund?.withdrawableAutopoolFund || 0} -> Sim=${correctFundSummary.withdrawableAutopoolFund} (Diff=${withdrawableDiff})`);
        console.log(`    - Pool Fund: DB=${dbFund?.poolFundTotal || 0} -> Sim=${correctFundSummary.poolFundTotal} (Diff=${poolDiff})`);
        console.log(`    - Reinvestment: DB=${dbFund?.reinvestmentFundTotal || 0} -> Sim=${correctFundSummary.reinvestmentFundTotal} (Diff=${reinvestmentDiff})`);

        if (!dryRun) {
          // Adjust isolated User Fund
          await AutopoolUserFund.findOneAndUpdate(
            { userId },
            {
              $set: {
                completedAutopoolLevel: correctFundSummary.completedAutopoolLevel,
                poolFundTotal: correctFundSummary.poolFundTotal,
                reinvestmentFundTotal: correctFundSummary.reinvestmentFundTotal,
                withdrawableAutopoolFund: correctFundSummary.withdrawableAutopoolFund,
                upgradeIdCount: correctFundSummary.upgradeIdCount,
                upgradeDeductionTotal: correctFundSummary.upgradeDeductionTotal,
                lastCompletedRound: targetLevel,
              },
            },
            { upsert: true }
          );

          // Write explanatory ledger transactions for differences
          if (withdrawableDiff !== 0) {
            await AutopoolFundTransaction.create({
              userId,
              sourceRebirthId: "SYSTEM_REPLAY_REPAIR",
              completedLevel: targetLevel >= 0 ? targetLevel : 0,
              type: withdrawableDiff > 0 ? "AUTOPOOL_REPAIR_ADJUSTMENT_CREDIT" : "AUTOPOOL_REPAIR_ADJUSTMENT_DEBIT",
              amount: Math.abs(withdrawableDiff),
              balanceAfter: correctFundSummary.withdrawableAutopoolFund,
              description: `System repair balance adjustment. Replayed correct withdrawable autopool fund: $${correctFundSummary.withdrawableAutopoolFund}`,
            });
          }

          // Sync User Completed Round in primary collection
          const userNodeRounds = Array.from(new Set(replayedCompletedNodes.map((n) => n.levelNumber))).sort((a, b) => a - b);
          await User.updateOne(
            { _id: userId },
            {
              $set: {
                currentCompletedAutopoolRound: targetLevel,
              },
              $addToSet: { processedAutopoolRounds: { $each: userNodeRounds } },
            }
          );
        }
      }
    }

    console.log(`[AutoPool Repair] Wallet Reconciliation stats:`);
    console.log(`  - Users inspected: ${userStats.inspected}`);
    console.log(`  - Completion progress records corrected: ${userStats.completionRecordUpdates}`);
    console.log(`  - Users with fund/wallet balance corrected: ${userStats.fundWalletAdjustments}`);

    // ─── 7. RESET SERIAL COUNTERS (IF --apply) ──────────────────────────
    if (!dryRun) {
      console.log("[AutoPool Repair] Synchronizing global sequence counters...");
      const { AutopoolQueueCounter } = await import("../modules/autopool/autopool-queue-counter.model.js");

      await AutopoolQueueCounter.findOneAndUpdate(
        { key: "GLOBAL_AUTOPOOL_QUEUE" },
        { $set: { currentSerialNo: nextQueueSerialNo - 1 } },
        { upsert: true }
      );

      await AutopoolQueueCounter.findOneAndUpdate(
        { key: "GLOBAL_AUTOPOOL_PLACEMENT" },
        { $set: { currentSerialNo: nextPlacementSerialNo - 1 } },
        { upsert: true }
      );

      console.log(`[AutoPool Repair] Sequence counters reset: GLOBAL_AUTOPOOL_QUEUE=${nextQueueSerialNo - 1}, GLOBAL_AUTOPOOL_PLACEMENT=${nextPlacementSerialNo - 1}`);
    }

    console.log("\n==================================================");
    console.log(" Chronological 3x3 AutoPool Repair completed successfully.");
    console.log("==================================================");
  } finally {
    // Always release repair lock and disconnect
    console.log("[AutoPool Repair] Releasing repair lock...");
    await releaseAutopoolRepairLock({ lockedBy: actor }).catch(console.error);
    console.log("[AutoPool Repair] Disconnecting database...");
    await mongoose.disconnect();
    console.log("[AutoPool Repair] Database disconnected.");
  }
}

main().catch((error) => {
  console.error("Chronological 3x3 AutoPool Repair failed:", error);
  process.exitCode = 1;
});
