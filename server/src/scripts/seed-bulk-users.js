/**
 * seed-bulk-users.js
 *
 * Seeds N users one-by-one and processes the AutoPool queue immediately
 * after each user so chronological placement order is always maintained.
 *
 * FULLY ADDITIVE — safe to run multiple times on the same DB.
 * Each run picks up from where the tree left off, placing new nodes
 * in available slots of the existing tree.
 *
 * Usage:
 *   node src/scripts/seed-bulk-users.js 200   ← seed 200 more users
 *   node src/scripts/seed-bulk-users.js 50    ← seed 50 more users
 *   node src/scripts/seed-bulk-users.js --count=100
 *
 * Design:
 *   1. processAutoPoolQueue() called after EVERY user (strict chronological order)
 *   2. Mid-seed repair every 50 users (catches background-job race conditions early)
 *   3. Final repair pass at end (catches any remaining stragglers)
 *   4. Exponential backoff (up to 5 retries) on transient errors
 *   5. Progress bar + live stats every 10 users
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { User } from "../modules/user/user.model.js";
import { WalletModel } from "../modules/user/wallet.model.js";
import { DepositModel } from "../modules/deposit/deposit.model.js";
import { referralService } from "../modules/referral/referral.service.js";
import autopool3x3Service from "../modules/autopool/autopool-3x3.service.js";
import { distributeDepositIncome } from "../modules/income/incomeDistribution.service.js";
import { generateMemberId } from "../utils/generateMemberId.js";
import { hashPassword } from "../common/helpers/password.helper.js";
import { seedOperationalAdmin } from "../modules/admin/seedOperationalAdmin.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

// ─── Name pools ────────────────────────────────────────────────────────────────
const FIRST_NAMES = [
  "Aarav", "Priya", "Rahul", "Sneha", "Vikram", "Ananya", "Rohan", "Meera",
  "Arjun", "Divya", "Karan", "Pooja", "Ravi", "Kavya", "Suresh", "Nisha",
  "Amit", "Swati", "Nikhil", "Isha", "Deepak", "Sanya", "Akash", "Riya",
  "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael",
  "Linda", "William", "Elizabeth", "David", "Barbara", "Richard", "Susan",
  "Thomas", "Sarah", "Charles", "Karen", "Mark", "Lisa", "Matthew", "Nancy",
  "Donald", "Sandra", "Jessica", "Alex", "Emma", "Ryan", "Sophia",
  "Liam", "Olivia", "Noah", "Ava", "Ethan", "Mia", "Lucas", "Charlotte",
  "Yusuf", "Fatima", "Aditya", "Zara", "Rajesh", "Simran", "Kabir", "Tanya",
];
const LAST_NAMES = [
  "Sharma", "Gupta", "Patel", "Singh", "Kumar", "Joshi", "Mehta", "Shah",
  "Verma", "Kapoor", "Malhotra", "Mishra", "Nair", "Pillai", "Reddy",
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
  "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez",
  "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
  "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark",
  "Lewis", "Robinson", "Walker", "Young", "Allen", "King", "Wright",
  "Iyer", "Menon", "Rao", "Das", "Bose", "Chandra", "Tiwari", "Saxena",
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Find best sponsor (fewest direct referrals) — fast with aggregation ───────
async function findBestSponsor() {
  // Use aggregation pipeline for O(1) DB query instead of N queries
  const result = await User.aggregate([
    { $match: { status: "active" } },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "sponsorUserId",
        as: "referrals",
      },
    },
    { $addFields: { referralCount: { $size: "$referrals" } } },
    { $sort: { referralCount: 1 } },
    { $limit: 1 },
    { $project: { _id: 1, memberId: 1 } },
  ]);

  if (!result.length) throw new Error("No active users found for sponsoring");
  return result[0];
}

// ─── Seed a single user (within its own transaction) ─────────────────────────
async function seedOneUser(adminUser, index, total) {
  const MAX_RETRIES = 5;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction({
        readConcern: { level: "snapshot" },
        writeConcern: { w: "majority" },
      });

      const sponsorUser = await findBestSponsor();
      const memberId = await generateMemberId();
      const passwordHash = await hashPassword("User@123");

      const fullName = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
      const email = `seed.${memberId.toLowerCase()}@bks.local`;
      const phone = `+91${Math.floor(7000000000 + Math.random() * 2999999999)}`;

      // ── Create User
      const [user] = await User.create(
        [
          {
            memberId,
            sponsorId: sponsorUser.memberId,
            sponsorUserId: sponsorUser._id,
            referredByUserId: sponsorUser._id,
            fullName,
            email,
            phone,
            passwordHash,
            plainPassword: "User@123",
            referralCode: memberId,
            referralLink: `http://localhost:3000/register?ref=${memberId}`,
            registrationSource: "admin",
            status: "active",
            isEmailVerified: true,
            isActivated: true,
            isActive: true,
            activationStatus: "ACTIVE",
            activatedAt: new Date(),
          },
        ],
        { session }
      );

      // ── Create Wallet
      await WalletModel.create(
        [{ userRef: user._id, fundWallet: 75, withdrawableFund: 0 }],
        { session }
      );

      // ── Build referral tree entry
      await referralService.createReferralTreeNode(
        { userId: user._id, sponsorUserId: sponsorUser._id },
        session
      );

      // ── Create approved deposit
      const [deposit] = await DepositModel.create(
        [
          {
            userRef: user._id,
            amount: 75,
            walletType: "USDT",
            txHash: `0xseed_${memberId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            proof: { url: "http://example.com/proof.png", publicId: "seed_proof" },
            status: "approved",
            processingStatus: "COMPLETED",
            reviewedBy: adminUser._id,
            reviewReason: "Automated bulk seeding",
            incomeDistributed: false,
            activationProcessed: false,
            autoPoolProcessed: false,
            rebirthProcessed: false,
          },
        ],
        { session }
      );

      // ── Enqueue rebirth nodes into AutoPool (PENDING — not placed yet)
      await autopool3x3Service.processDepositSuccessForAutoPool(deposit, session);

      // ── Distribute level/sponsor income to uplines
      await distributeDepositIncome({
        userId: user._id,
        depositId: deposit._id,
        depositDoc: deposit,
        session,
      });

      await session.commitTransaction();
      return { memberId, fullName, sponsorMemberId: sponsorUser.memberId };
    } catch (err) {
      await session.abortTransaction().catch(() => {});

      const isTransient =
        err.hasErrorLabel?.("TransientTransactionError") ||
        err.code === 112 ||
        /write conflict/i.test(err.message || "") ||
        /catalog changes/i.test(err.message || "");

      if (isTransient && attempt < MAX_RETRIES - 1) {
        attempt++;
        const delay = Math.pow(2, attempt) * 150;
        console.warn(
          `\n  ⚠️  [${index}/${total}] Transient error, retry ${attempt}/${MAX_RETRIES - 1} in ${delay}ms...`
        );
        await sleep(delay);
      } else {
        console.error(`\n  ❌ [${index}/${total}] Failed permanently:`, err.message);
        throw err;
      }
    } finally {
      session.endSession();
    }
  }
}

// ─── Process queue with retry ──────────────────────────────────────────────────
async function processQueue(label = "") {
  const MAX_Q_RETRIES = 4;
  for (let r = 1; r <= MAX_Q_RETRIES; r++) {
    try {
      const result = await autopool3x3Service.processAutoPoolQueue();
      if (result.placedCount > 0) {
        process.stdout.write(` → placed ${result.placedCount}\n`);
      } else {
        process.stdout.write(`\n`);
      }
      return result;
    } catch (err) {
      const isTransient =
        err.hasErrorLabel?.("TransientTransactionError") ||
        err.code === 112 ||
        /write conflict|catalog changes/i.test(err.message || "");

      if (isTransient && r < MAX_Q_RETRIES) {
        await sleep(r * 300);
      } else {
        process.stdout.write(`\n`);
        console.warn(`  ⚠️  Queue [${label}] error (non-fatal): ${err.message}`);
        return { placedCount: 0 };
      }
    }
  }
  return { placedCount: 0 };
}

// ─── Run repair for any missed rebirths ──────────────────────────────────────
async function runRepair(label = "post-seed") {
  const { AutoPoolNode } = await import("../modules/autopool/autopool-matrix.model.js");

  const brokenNodes = await AutoPoolNode.find({
    nodeType: "REBIRTH",
    status: "COMPLETED",
    $or: [
      { rebirthGenerated: false },
      { rebirthGenerated: { $exists: false } },
    ],
  })
    .sort({ levelNumber: 1, levelSequence: 1, completedAt: 1 })
    .lean();

  if (brokenNodes.length === 0) {
    console.log(`  ✅ [${label}] No missing rebirths — all clear.`);
    return 0;
  }

  console.log(`  🔧 [${label}] Repairing ${brokenNodes.length} node(s) with missing rebirths...`);
  let repaired = 0;

  for (const node of brokenNodes) {
    if (node.levelNumber >= 9) {
      await AutoPoolNode.findByIdAndUpdate(node._id, {
        $set: { rebirthGenerated: true, rebirthGeneratedAt: new Date() },
      });
      continue;
    }
    try {
      await autopool3x3Service.generateNextLevelRebirthsForCompletedRebirthNode(
        node.ownerUserId,
        node.levelNumber,
        node.levelSequence,
        null
      );
      repaired++;
    } catch (err) {
      console.warn(`    ⚠️  Could not repair ${node.nodeCode}: ${err.message}`);
    }
  }

  if (repaired > 0) {
    process.stdout.write(`  ✅ Repaired ${repaired}. Flushing queue...`);
    await processQueue(`repair-${label}`);
  }

  return repaired;
}

// ─── Print live summary ───────────────────────────────────────────────────────
async function printSummary(seededSoFar, totalToSeed) {
  const { AutoPoolNode } = await import("../modules/autopool/autopool-matrix.model.js");

  const [pending, placed, completed] = await Promise.all([
    AutoPoolNode.countDocuments({ status: "PENDING" }),
    AutoPoolNode.countDocuments({ status: "PLACED" }),
    AutoPoolNode.countDocuments({ status: "COMPLETED" }),
  ]);

  const totalNodes = pending + placed + completed;
  const pct = Math.round((seededSoFar / totalToSeed) * 100);
  const filled = Math.round(pct / 5);
  const bar = "█".repeat(filled) + "░".repeat(20 - filled);

  console.log(`\n  ┌─ Progress [${bar}] ${pct}% (${seededSoFar}/${totalToSeed} this run)`);
  console.log(`  │  Nodes: PENDING=${pending} | PLACED=${placed} | COMPLETED=${completed} | TOTAL=${totalNodes}`);
  console.log(`  └${"─".repeat(67)}\n`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  let count = 200;

  for (const arg of args) {
    if (arg.startsWith("--count=")) {
      const n = parseInt(arg.split("=")[1], 10);
      if (!isNaN(n) && n > 0) count = n;
    } else if (!arg.startsWith("-")) {
      const n = parseInt(arg, 10);
      if (!isNaN(n) && n > 0) count = n;
    }
  }

  console.log("══════════════════════════════════════════════════════");
  console.log(`  🚀 BULK USER SEEDING  —  ${count} users`);
  console.log("  ✔  Fully additive — syncs with existing DB data");
  console.log("  ✔  Queue flushed after EVERY user (chronological)");
  console.log("  ✔  Mid-seed repair every 50 users");
  console.log("  ✔  Final repair pass at end");
  console.log("══════════════════════════════════════════════════════\n");

  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI missing in .env");

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected to MongoDB");

  // Count existing users so the user knows the starting point
  const existingCount = await User.countDocuments();
  console.log(`ℹ️  Existing users in DB: ${existingCount}`);

  // Ensure admin exists
  let adminUser = await User.findOne({ isOperationalAdmin: true }).lean();
  if (!adminUser) {
    console.log("ℹ️  Operational Admin not found — seeding now...");
    await seedOperationalAdmin();
    adminUser = await User.findOne({ isOperationalAdmin: true }).lean();
  }
  console.log(`ℹ️  Admin: ${adminUser.fullName} (${adminUser.memberId})\n`);

  const stats = { seeded: 0, failed: 0, totalQueuePlaced: 0, totalRepaired: 0 };
  const startTime = Date.now();

  for (let i = 1; i <= count; i++) {
    // ── 1. Seed the user
    process.stdout.write(`  [${String(i).padStart(3, "0")}/${count}] `);
    try {
      const result = await seedOneUser(adminUser, i, count);
      process.stdout.write(`✅ ${result.memberId} (${result.fullName}) ← ${result.sponsorMemberId}`);
      stats.seeded++;
    } catch (err) {
      process.stdout.write(`❌ FAILED\n`);
      stats.failed++;
      continue;
    }

    // ── 2. Flush queue immediately (chronological ordering)
    process.stdout.write(`  ⚙️ `);
    const qr = await processQueue(`u${i}`);
    stats.totalQueuePlaced += qr.placedCount ?? 0;

    // ── 3. Progress summary every 10 users
    if (i % 10 === 0 || i === count) {
      await printSummary(i, count);
    }

    // ── 4. Mid-seed repair every 50 users (catch background-job race gaps early)
    if (i % 50 === 0 && i < count) {
      console.log(`\n  ── Mid-seed repair check at user ${i}/${count} ──`);
      const r = await runRepair(`mid-${i}`);
      stats.totalRepaired += r;
      console.log();
    }
  }

  // ── 5. Final repair pass
  console.log("══════════════════════════════════════════════════════");
  console.log("  🔧 FINAL REPAIR PASS");
  console.log("══════════════════════════════════════════════════════");
  const finalRepaired = await runRepair("final");
  stats.totalRepaired += finalRepaired;

  // ── 6. Final queue flush
  process.stdout.write("\n  ⚙️  Final queue flush... ");
  const finalQ = await processQueue("final");
  stats.totalQueuePlaced += finalQ.placedCount ?? 0;

  // ── 7. Summary
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const totalNow = await User.countDocuments();

  console.log("\n══════════════════════════════════════════════════════");
  console.log("  🎉 BULK SEEDING COMPLETE");
  console.log("══════════════════════════════════════════════════════");
  console.log(`  ✅ Users seeded this run : ${stats.seeded}`);
  console.log(`  ❌ Users failed          : ${stats.failed}`);
  console.log(`  👥 Total users in DB now : ${totalNow}`);
  console.log(`  🔧 Rebirths repaired     : ${stats.totalRepaired}`);
  console.log(`  📦 Queue nodes placed    : ${stats.totalQueuePlaced}`);
  console.log(`  ⏱️  Time elapsed          : ${elapsed}s`);
  if (stats.failed === 0) {
    console.log("  🟢 STATUS: CLEAN — no failures");
  } else {
    console.log(`  🟡 STATUS: PARTIAL — ${stats.failed} user(s) failed`);
  }
  console.log("══════════════════════════════════════════════════════\n");

  await mongoose.disconnect();
  process.exit(stats.failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("\n❌ Fatal error:", e);
  process.exit(1);
});
