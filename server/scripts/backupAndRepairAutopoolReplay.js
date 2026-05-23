import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { User } from "../src/modules/user/user.model.js";
import { WalletModel } from "../src/modules/user/wallet.model.js";
import { DepositModel } from "../src/modules/deposit/deposit.model.js";
import { WithdrawalModel } from "../src/modules/withdrawal/withdrawal.model.js";
import { RebirthId } from "../src/modules/autopool/rebirth.model.js";
import { AutoPoolNode } from "../src/modules/autopool/autopool-matrix.model.js";
import { AutoPoolLevelCompletion } from "../src/modules/autopool/autopool-level-completion.model.js";
import { UpgradeAliasId } from "../src/modules/autopool/upgrade-alias-id.model.js";
import { AutopoolUserFund } from "../src/modules/autopool/autopool-user-fund.model.js";
import { AutopoolFundTransaction } from "../src/modules/autopool/autopool-fund-transaction.model.js";
import { IncomeLedgerModel } from "../src/modules/income/income.model.js";
import { UserRoundProgress } from "../src/modules/autopool/user-round-progress.model.js";
import { ReferralTree } from "../src/modules/referral/referral-tree.model.js";
import { AutopoolQueueCounter } from "../src/modules/autopool/autopool-queue-counter.model.js";
import { autopool3x3Service } from "../src/modules/autopool/autopool-3x3.service.js";
import {
  acquireAutopoolRepairLock,
  releaseAutopoolRepairLock,
  AUTOPOOL_REPAIR_VERSION,
} from "../src/modules/autopool/autopool-repair-lock.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

const args = process.argv.slice(2);
const flags = new Set(args.filter((arg) => arg.startsWith("--")));
const applyMode = flags.has("--apply");
const dryRun = flags.has("--dry-run") || (!applyMode && !flags.has("--backup-only") && !args.some(a => a.startsWith("--from-backup")));
const backupOnly = flags.has("--backup-only");

let fromBackupFile = null;
const fromBackupArg = args.find(a => a.startsWith("--from-backup="));
if (fromBackupArg) {
  fromBackupFile = fromBackupArg.split("=")[1];
} else if (args.includes("--from-backup")) {
  const index = args.indexOf("--from-backup");
  if (index >= 0 && index < args.length - 1) {
    fromBackupFile = args[index + 1];
  }
}

const repairLabel = "backup-and-repair";
const actor = `script:${repairLabel}`;

/**
 * 1. Perform a complete backup of the database
 */
async function performBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(__dirname, "../backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const db = mongoose.connection.db;

  // A. Full Database Audit Backup
  console.log("📦 Creating full database audit backup...");
  const collections = await db.listCollections().toArray();
  const fullAudit = {};
  for (const col of collections) {
    const docs = await db.collection(col.name).find({}).toArray();
    fullAudit[col.name] = docs;
  }
  const auditPath = path.join(backupDir, `full-db-audit-${timestamp}.json`);
  fs.writeFileSync(auditPath, JSON.stringify(fullAudit, null, 2));
  console.log(`✅ Full database audit backup saved to: ${auditPath}`);

  // B. Permanent Collections Backup (8 Collections)
  console.log("📦 Creating permanent collections backup...");
  const permanentData = {
    users: await db.collection("users").find({}).toArray(),
    wallets: await db.collection("wallets").find({}).toArray(),
    deposits: await db.collection("deposits").find({ status: "approved" }).toArray(),
    rebirthids: await db.collection("rebirthids").find({ levelNumber: 0, rebirthType: "DEPOSIT_REBIRTH" }).toArray(),
    withdrawals: await db.collection("withdrawals").find({}).toArray(),
    upgradealiasids: await db.collection("upgradealiasids").find({}).toArray(),
    incomeledgers: await db.collection("incomeledgers").find({ incomeType: { $ne: "autopool" } }).toArray(),
    referraltrees: await db.collection("referraltrees").find({}).toArray(),
  };
  const permPath = path.join(backupDir, `permanent-backup-${timestamp}.json`);
  fs.writeFileSync(permPath, JSON.stringify(permanentData, null, 2));
  console.log(`✅ Permanent collections backup saved to: ${permPath}`);

  return { permPath, auditPath };
}

/**
 * 2. Restore permanent collections from a past backup file
 */
async function restoreFromBackup(backupFilePath) {
  console.log(`⏳ Restoring permanent collections from backup file: ${backupFilePath}`);
  if (!fs.existsSync(backupFilePath)) {
    throw new Error(`Backup file not found at: ${backupFilePath}`);
  }
  const data = JSON.parse(fs.readFileSync(backupFilePath, "utf8"));
  
  const db = mongoose.connection.db;

  const collectionsToRestore = [
    { key: "users", collectionName: "users", model: User },
    { key: "wallets", collectionName: "wallets", model: WalletModel },
    { key: "deposits", collectionName: "deposits", model: DepositModel },
    { key: "rebirthids", collectionName: "rebirthids", model: RebirthId },
    { key: "withdrawals", collectionName: "withdrawals", model: WithdrawalModel },
    { key: "upgradealiasids", collectionName: "upgradealiasids", model: UpgradeAliasId },
    { key: "incomeledgers", collectionName: "incomeledgers", model: IncomeLedgerModel },
    { key: "referraltrees", collectionName: "referraltrees", model: ReferralTree },
  ];

  for (const item of collectionsToRestore) {
    if (data[item.key]) {
      console.log(`   Restoring collection: ${item.collectionName} (${data[item.key].length} documents)`);
      
      // Delete existing documents
      await db.collection(item.collectionName).deleteMany({});
      
      if (data[item.key].length > 0) {
        // Map string Date/ObjectIDs back to proper types
        const parsedDocs = data[item.key].map(doc => {
          const copy = { ...doc };
          if (copy._id && typeof copy._id === "string") {
            copy._id = new mongoose.Types.ObjectId(copy._id);
          }
          // Parse parent/ref fields
          for (const key of Object.keys(copy)) {
            if (copy[key] && typeof copy[key] === "object" && copy[key].$oid) {
              copy[key] = new mongoose.Types.ObjectId(copy[key].$oid);
            } else if (copy[key] && typeof copy[key] === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(copy[key])) {
              copy[key] = new Date(copy[key]);
            }
          }
          return copy;
        });

        // Insert using Mongoose Model if available for schema validation and indices
        if (item.model) {
          await item.model.insertMany(parsedDocs);
        } else {
          await db.collection(item.collectionName).insertMany(parsedDocs);
        }
      }
    }
  }
  console.log("✅ Restore from backup completed successfully.");
}

/**
 * 3. Restore the entire database from a full audit backup file
 */
async function restoreFullDatabase(backupFilePath) {
  console.log(`⏳ Restoring entire database from audit backup file: ${backupFilePath}`);
  if (!fs.existsSync(backupFilePath)) {
    throw new Error(`Backup file not found at: ${backupFilePath}`);
  }
  const data = JSON.parse(fs.readFileSync(backupFilePath, "utf8"));
  const db = mongoose.connection.db;

  for (const colName of Object.keys(data)) {
    if (colName.startsWith("system.")) continue;
    console.log(`   Restoring collection: ${colName} (${data[colName].length} documents)`);
    
    // Drop all existing documents in the collection
    await db.collection(colName).deleteMany({});
    
    if (data[colName].length > 0) {
      // Map string Date/ObjectIDs back to proper types
      const parsedDocs = data[colName].map(doc => {
        const copy = { ...doc };
        if (copy._id && typeof copy._id === "string") {
          copy._id = new mongoose.Types.ObjectId(copy._id);
        }
        for (const key of Object.keys(copy)) {
          if (copy[key] && typeof copy[key] === "object" && copy[key].$oid) {
            copy[key] = new mongoose.Types.ObjectId(copy[key].$oid);
          } else if (copy[key] && typeof copy[key] === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(copy[key])) {
            copy[key] = new Date(copy[key]);
          }
        }
        return copy;
      });
      await db.collection(colName).insertMany(parsedDocs);
    }
  }
  console.log("✅ Full database restore completed successfully.");
}

async function run() {
  let backups = null;
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI environment variable is missing");
    }

    console.log("================================================================");
    console.log("🚀 MLM AUTOPOOL REPLAY & REPAIR ENGINE STARTED");
    console.log(`   Mode: ${dryRun ? "DRY-RUN (SIMULATION)" : backupOnly ? "BACKUP-ONLY" : "APPLY"}`);
    if (fromBackupFile) {
      console.log(`   From Backup: ${fromBackupFile}`);
    }
    console.log(`   Repair version: ${AUTOPOOL_REPAIR_VERSION}`);
    console.log("================================================================");

    await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || undefined });
    console.log("✅ Connected to MongoDB successfully.");

    // A. Handle Backup-Only mode
    if (backupOnly) {
      await performBackup();
      await mongoose.disconnect();
      console.log("👋 Done.");
      process.exit(0);
    }

    // B. Acquire system lock
    console.log("⏳ Acquiring system repair lock...");
    const lock = await acquireAutopoolRepairLock({
      lockedBy: actor,
      mode: dryRun ? "dry-run" : "apply",
    });

    if (!lock) {
      throw new Error("Unable to acquire autopool repair lock. System might be locked or concurrently updated.");
    }
    console.log("🔒 System repair lock acquired successfully.");

    // C. Handle Restore from Backup if requested
    if (fromBackupFile) {
      await restoreFromBackup(fromBackupFile);
    }

    // D. Perform complete safety backup before making changes
    backups = await performBackup();

    // E. Execute Replay & Repair directly (using full DB restore for dry-run simulation)
    const session = null;
    try {

      console.log("\n🧹 Phase 1: Cleanse & Archive rebuildable collections...");

      // 1. Archive old generated rebirths in RebirthId
      const oldGeneratedRebirthsCount = await RebirthId.countDocuments({
        $or: [
          { levelNumber: { $gt: 0 } },
          { rebirthType: "AUTOPOOL_GENERATED_REBIRTH" },
          { sourceType: "AUTOPOOL_COMPLETION" },
        ],
      }).session(session);

      console.log(`   - Found ${oldGeneratedRebirthsCount} old generated rebirth IDs to archive.`);
      await RebirthId.updateMany(
        {
          $or: [
            { levelNumber: { $gt: 0 } },
            { rebirthType: "AUTOPOOL_GENERATED_REBIRTH" },
            { sourceType: "AUTOPOOL_COMPLETION" },
          ],
        },
        {
          $set: {
            isActiveInAutopool: false,
            repairStatus: "OLD_GENERATED_ARCHIVED",
            status: "INACTIVE",
          },
        },
        { session }
      );

      // 2. Archive old generated AutoPoolNode records
      const oldGeneratedNodesCount = await AutoPoolNode.countDocuments({
        $or: [
          { levelNumber: { $gt: 0 } },
          { nodeType: "REBIRTH", rebirthType: "AUTOPOOL_GENERATED_REBIRTH" },
        ],
      }).session(session);

      console.log(`   - Found ${oldGeneratedNodesCount} old generated matrix nodes to archive.`);
      await AutoPoolNode.updateMany(
        {
          $or: [
            { levelNumber: { $gt: 0 } },
            { nodeType: "REBIRTH", rebirthType: "AUTOPOOL_GENERATED_REBIRTH" },
          ],
        },
        {
          $set: {
            isActiveInAutopool: false,
            status: "ARCHIVED",
            repairStatus: "OLD_GENERATED_ARCHIVED",
          },
        },
        { session }
      );

      // 3. Delete all AutoPoolQueue items
      const deletedQueueCount = await mongoose.connection.db.collection("autopoolqueues").countDocuments();
      console.log(`   - Deleting ${deletedQueueCount} enqueued queue records...`);
      await mongoose.connection.db.collection("autopoolqueues").deleteMany({}, { session });

      // 4. Delete all AutoPoolNode matrix records EXCEPT for root BKS000000-0.1 and admin BKS000000-0.2
      const totalMatrixCount = await AutoPoolNode.countDocuments({
        nodeCode: { $nin: ["BKS000000-0.1", "BKS000000-0.2"] },
      }).session(session);

      console.log(`   - Deleting ${totalMatrixCount} other matrix nodes...`);
      await AutoPoolNode.deleteMany(
        { nodeCode: { $nin: ["BKS000000-0.1", "BKS000000-0.2"] } },
        { session }
      );

      // 5. Delete all RebirthId records EXCEPT BKS000000-0.1, BKS000000-0.2 and archived old nodes
      const deletedRebirthCount = await RebirthId.countDocuments({
        rebirthCode: { $nin: ["BKS000000-0.1", "BKS000000-0.2"] },
        repairStatus: { $ne: "OLD_GENERATED_ARCHIVED" },
      }).session(session);

      console.log(`   - Deleting ${deletedRebirthCount} active rebirths...`);
      await RebirthId.deleteMany(
        {
          rebirthCode: { $nin: ["BKS000000-0.1", "BKS000000-0.2"] },
          repairStatus: { $ne: "OLD_GENERATED_ARCHIVED" },
        },
        { session }
      );

      // 6. Delete all system-generated alias user accounts and their child elements
      const aliasUsers = await User.find({ isAliasAccount: true }).select("_id memberId").session(session);
      const aliasUserIds = aliasUsers.map(u => u._id);
      console.log(`   - Found ${aliasUsers.length} system-generated alias users to delete.`);
      if (aliasUsers.length > 0) {
        await User.deleteMany({ _id: { $in: aliasUserIds } }, { session });
        await WalletModel.deleteMany({ userRef: { $in: aliasUserIds } }, { session });
        await mongoose.connection.db.collection("userprofiles").deleteMany({ userId: { $in: aliasUserIds } }, { session });
        await ReferralTree.deleteMany({ userId: { $in: aliasUserIds } }, { session });
        await DepositModel.deleteMany({ userRef: { $in: aliasUserIds } }, { session });
      }

      // 7. Reset root BKS000000-0.1 and admin BKS000000-0.2 parent/child references cleanly
      console.log("   - Resetting operational roots BKS000000-0.1 and BKS000000-0.2 parent/child links...");
      const root01 = await AutoPoolNode.findOne({ nodeCode: "BKS000000-0.1" }).session(session);
      const root02 = await AutoPoolNode.findOne({ nodeCode: "BKS000000-0.2" }).session(session);

      if (root01 && root02) {
        root01.directChildren = [root02._id];
        root01.directChildrenCount = 1;
        root01.isCompleted = false;
        root01.completedAt = null;
        root01.rebirthGenerated = false;
        root01.rebirthGeneratedAt = null;
        await root01.save({ session });

        root02.parentNodeId = root01._id;
        root02.matrixParentId = root01._id;
        root02.childSlot = 1;
        root02.directChildren = [];
        root02.directChildrenCount = 0;
        root02.isCompleted = false;
        root02.completedAt = null;
        root02.rebirthGenerated = false;
        root02.rebirthGeneratedAt = null;
        await root02.save({ session });
      }

      // 8. Reset the global queue counters
      console.log("   - Resetting global queue counters back to 2...");
      await AutopoolQueueCounter.findOneAndUpdate(
        { key: "GLOBAL_AUTOPOOL_QUEUE" },
        { $set: { currentSerialNo: 2 } },
        { session }
      );
      await AutopoolQueueCounter.findOneAndUpdate(
        { key: "GLOBAL_AUTOPOOL_PLACEMENT" },
        { $set: { currentSerialNo: 2 } },
        { session }
      );

      // Clear all queue serial lock records
      await mongoose.connection.db.collection("queueseriallocks").deleteMany({}, { session });

      // 9. Delete all AutopoolUserFund, AutopoolFundTransaction and UserRoundProgress records
      console.log("   - Deleting all existing isolated autopool user funds, ledger transactions, and user round progress records...");
      await AutopoolUserFund.deleteMany({}, { session });
      await AutopoolFundTransaction.deleteMany({}, { session });
      await UserRoundProgress.deleteMany({}, { session });

      console.log("\n⚙️ Phase 2: Deterministic Chronological Deposit Replay...");

      // Enable bypass for repair lock during the sequential replay
      global.bypassAutopoolRepairLock = true;

      // Get all active (non-alias) users to isolate from alias user deposits
      const activeUsers = await User.find({ isAliasAccount: { $ne: true } }).select("_id").session(session);
      const activeUserIds = activeUsers.map(u => u._id);

      // Fetch all normal approved deposits sorted chronologically
      const normalDeposits = await DepositModel.find({
        status: "approved",
        userRef: { $in: activeUserIds },
        type: { $ne: "ALIAS_AUTO_DEPOSIT" },
      })
        .sort({ createdAt: 1, _id: 1 })
        .session(session);

      console.log(`   - Found ${normalDeposits.length} approved deposits to replay chronologically.`);

      let replayCounter = 0;
      for (const deposit of normalDeposits) {
        replayCounter++;
        console.log(`   [${replayCounter}/${normalDeposits.length}] Replaying deposit ${deposit.txHash || deposit._id} for user ${deposit.userRef}...`);

        // Ensure user status is active
        await User.updateOne(
          { _id: deposit.userRef },
          {
            $set: {
              status: "active",
              isActivated: true,
              isActive: true,
              activationStatus: "ACTIVE",
            },
          },
          { session }
        );

        // Reset deposit autoPoolProcessed flag so processDepositSuccessForAutoPool handles it
        deposit.autoPoolProcessed = false;
        await deposit.save({ session });

        // Trigger standard live activation (Creates 0.1 and 0.2 rebirth nodes and enqueues them)
        await autopool3x3Service.processDepositSuccessForAutoPool(deposit, session);

        // Process event queue sequentially until all enqueued items for this deposit are stabilized
        let placedTotal = 0;
        let queueResult;
        do {
          queueResult = await autopool3x3Service.processNextQueueBatch(100, session);
          placedTotal += queueResult?.placedCount || 0;
        } while (queueResult && queueResult.placedCount > 0);

        console.log(`     ✨ Stable. Placed ${placedTotal} nodes.`);
      }

      // Restore repair lock enforcement
      global.bypassAutopoolRepairLock = false;

      console.log("\n💼 Phase 3: Withdrawal Reconciliation & Wallet Balance Sync...");
      const replayedFunds = await AutopoolUserFund.find({}).session(session);
      console.log(`   - Reconciling withdrawals for ${replayedFunds.length} funded users...`);

      for (const fund of replayedFunds) {
        // Query approved and pending withdrawals
        const approvedWithdrawals = await WithdrawalModel.find({
          userRef: fund.userId,
          status: { $in: ["approved", "processed"] },
        }).session(session);

        const pendingWithdrawals = await WithdrawalModel.find({
          userRef: fund.userId,
          status: "pending",
        }).session(session);

        const withdrawnAmount = approvedWithdrawals.reduce((sum, w) => sum + w.payableAmount || w.amount, 0);
        const pendingWithdrawAmount = pendingWithdrawals.reduce((sum, w) => sum + w.payableAmount || w.amount, 0);

        fund.totalPoolFund = fund.poolFundTotal;
        fund.totalReinvestmentFund = fund.reinvestmentFundTotal;
        fund.grossWithdrawableFund = fund.withdrawableAutopoolFund;
        fund.withdrawnAmount = withdrawnAmount;
        fund.pendingWithdrawAmount = pendingWithdrawAmount;
        fund.availableWithdrawableFund = fund.grossWithdrawableFund - withdrawnAmount - pendingWithdrawAmount;

        await fund.save({ session });

        console.log(`     User ${fund.userId}: Gross=${fund.grossWithdrawableFund} | Withdrawn=${withdrawnAmount} | Pending=${pendingWithdrawAmount} | Net Available=${fund.availableWithdrawableFund}`);
      }

      console.log("\n🔬 Phase 4: Structural and Integrity Checks...");

      // 1. Verify single root BKS000000-0.1 exists
      const rootCount = await AutoPoolNode.countDocuments({ nodeType: "ROOT", isActiveInAutopool: true }).session(session);
      console.log(`   - Root Node Count: ${rootCount} (Expected: 1)`);
      if (rootCount !== 1) {
        throw new Error(`[CRITICAL] Integrity Check Failed: Found ${rootCount} active root nodes instead of 1.`);
      }

      // 2. Verify no active node has > 3 children
      const overfilledNodes = await AutoPoolNode.find({
        isActiveInAutopool: true,
        directChildrenCount: { $gt: 3 },
      }).session(session);
      console.log(`   - Overfilled Nodes (>3 children): ${overfilledNodes.length} (Expected: 0)`);
      if (overfilledNodes.length > 0) {
        for (const n of overfilledNodes) {
          console.warn(`     🚨 Node ${n.nodeCode} has ${n.directChildrenCount} children!`);
        }
        throw new Error(`[CRITICAL] Integrity Check Failed: Found ${overfilledNodes.length} matrix nodes with more than 3 children.`);
      }

      // 3. Verify every active placed node has a parent (except root)
      const orphanNodes = await AutoPoolNode.find({
        isActiveInAutopool: true,
        status: "PLACED",
        nodeType: { $ne: "ROOT" },
        parentNodeId: null,
      }).session(session);
      console.log(`   - Orphan Active Placed Nodes: ${orphanNodes.length} (Expected: 0)`);
      if (orphanNodes.length > 0) {
        for (const n of orphanNodes) {
          console.warn(`     🚨 Orphan node: ${n.nodeCode}`);
        }
        throw new Error(`[CRITICAL] Integrity Check Failed: Found ${orphanNodes.length} orphan active placed nodes.`);
      }

      console.log("✅ All integrity and structural checks passed successfully!");

      if (dryRun) {
        console.log("\n⚠️ [DRY-RUN MODE] Simulation validation succeeded.");
      } else {
        console.log("\n🚀 [APPLY MODE] Database updates persisted permanently.");
        console.log("🎉 DATABASE REPAIR AND ALIGNMENT COMPLETED SUCCESSFULLY!");
      }

    } catch (txError) {
      console.error("\n❌ Error during repair execution:", txError);
      throw txError;
    }

  } catch (error) {
    console.error("\n❌ Critical Error during repair process:", error);
    process.exitCode = 1;
  } finally {
    if (dryRun && backups && backups.auditPath) {
      try {
        console.log("\n🧹 [DRY-RUN MODE] Restoring original database state from audit backup...");
        await restoreFullDatabase(backups.auditPath);
        console.log("✅ Original database state restored successfully.");
      } catch (restoreErr) {
        console.error("🚨 [CRITICAL] Failed to restore database after dry-run! Use --from-backup flag to manually recover.", restoreErr);
      }
    }

    global.bypassAutopoolRepairLock = false;
    console.log("\n🔒 Releasing system repair lock...");
    await releaseAutopoolRepairLock({ lockedBy: actor }).catch(() => null);
    await mongoose.disconnect();
    console.log("👋 Disconnected from database.");
  }
}

run();
