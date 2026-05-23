import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { User } from "../src/modules/user/user.model.js";
import { WalletModel } from "../src/modules/user/wallet.model.js";
import { DepositModel } from "../src/modules/deposit/deposit.model.js";
import { referralService } from "../src/modules/referral/referral.service.js";
import { autopool3x3Service } from "../src/modules/autopool/autopool-3x3.service.js";
import { distributeDepositIncome } from "../src/modules/income/incomeDistribution.service.js";
import { generateMemberId } from "../src/utils/generateMemberId.js";
import { hashPassword } from "../src/common/helpers/password.helper.js";
import { seedOperationalAdmin } from "../src/modules/admin/seedOperationalAdmin.js";
import { AutopoolRepairLock } from "../src/modules/autopool/autopool-repair-lock.model.js";
import { releaseAutopoolRepairLock } from "../src/modules/autopool/autopool-repair-lock.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

async function findBestSponsor() {
  const potentialSponsors = await User.find({ status: "active", isAliasAccount: { $ne: true } });
  if (potentialSponsors.length === 0) {
    throw new Error("Operational Admin or active users not found");
  }

  // Find direct children counts for each active user to build a perfectly balanced wide tree
  const sponsorCounts = [];
  for (const sponsor of potentialSponsors) {
    const count = await User.countDocuments({ sponsorUserId: sponsor._id, isAliasAccount: { $ne: true } });
    sponsorCounts.push({ sponsor, count });
  }

  // Sort by count ascending, so we prioritize users with fewer referrals
  sponsorCounts.sort((a, b) => a.count - b.count);

  return sponsorCounts[0].sponsor;
}

async function run() {
  try {
    const args = process.argv.slice(2);
    let count = 50; // Default count for quick validation seeding

    for (const arg of args) {
      if (arg.startsWith("--count=")) {
        const parsed = parseInt(arg.split("=")[1], 10);
        if (!isNaN(parsed) && parsed > 0) count = parsed;
      } else if (!arg.startsWith("-")) {
        const parsed = parseInt(arg, 10);
        if (!isNaN(parsed) && parsed > 0) count = parsed;
      }
    }

    console.log("================================================================");
    console.log(`🚀 STARTING SEQUENTIAL EVENT-DRIVEN USER SEEDING: Seeding ${count} Users`);
    console.log(`   Event-Driven FIFO Queue Flow (Batch worker processing)`);
    console.log("================================================================");

    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI environment variable is missing");
    }

    await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || undefined });
    console.log("✅ Connected to MongoDB successfully.");

    // 1. Ensure Operational Admin BKS000000 exists
    let adminUser = await User.findOne({ memberId: "BKS000000" });
    if (!adminUser) {
      console.log("ℹ️ Admin user BKS000000 not found. Initializing operational admin...");
      await seedOperationalAdmin();
      adminUser = await User.findOne({ memberId: "BKS000000" });
      if (!adminUser) {
        throw new Error("Admin seeding failed. BKS000000 is still missing.");
      }
    } else {
      console.log("✅ Verified operational admin BKS000000.");
    }

    const firstNames = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen", "Mark", "Lisa", "Matthew", "Nancy", "Donald", "Sandra"];
    const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez"];

    const ensureAutopoolQueueUnlocked = async () => {
      const lock = await AutopoolRepairLock.findOne({ key: "autopool_chronological_replay_v1", isLocked: true });
      if (!lock) return false;

      console.warn(
        `   ⚠️  AutoPool repair lock detected (${lock.lockedBy || "unknown"}). Releasing stale lock before stabilization...`,
      );
      await releaseAutopoolRepairLock({ lockedBy: lock.lockedBy });
      return true;
    };

    for (let i = 1; i <= count; i++) {
      let retryCount = 0;
      const maxRetries = 3;
      let success = false;

      while (retryCount < maxRetries && !success) {
        const session = await mongoose.startSession();
        try {
          session.startTransaction();

          const sponsorUser = await findBestSponsor();
          const memberId = await generateMemberId();
          const passwordHash = await hashPassword("User@123");

          const randomFirst = firstNames[Math.floor(Math.random() * firstNames.length)];
          const randomLast = lastNames[Math.floor(Math.random() * lastNames.length)];
          const fullName = `${randomFirst} ${randomLast}`;
          const email = `seed.user.${memberId.toLowerCase()}@bkswealthclub.local`;

          console.log(`\n🌱 [${i}/${count}] Registering: ${fullName} (${memberId}) | Sponsor: ${sponsorUser.memberId}`);

          // Create User
          const userDocs = await User.create([
            {
              memberId,
              sponsorId: sponsorUser.memberId,
              sponsorUserId: sponsorUser._id,
              referredByUserId: sponsorUser._id,
              fullName,
              email,
              phone: `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`,
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
            }
          ], { session });
          const user = userDocs[0];

          // Create Wallet
          await WalletModel.create([
            {
              userRef: user._id,
              fundWallet: 75,
              withdrawableFund: 0,
            }
          ], { session });

          // Create Referral Tree Node
          await referralService.createReferralTreeNode({
            userId: user._id,
            sponsorUserId: sponsorUser._id,
          }, session);

          // Create approved deposit
          const depositDocs = await DepositModel.create([
            {
              userRef: user._id,
              amount: 75,
              walletType: "USDT",
              txHash: `0x_seed_tx_${memberId}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
              proof: { url: "http://example.com/proof.png", publicId: "proof" },
              status: "approved",
              processingStatus: "COMPLETED",
              reviewedBy: adminUser._id,
              reviewReason: "Automated seeding activation",
              incomeDistributed: false,
              activationProcessed: false,
              autoPoolProcessed: false,
              rebirthProcessed: false,
            }
          ], { session });
          const deposit = depositDocs[0];

          // 2. Trigger standard autopool activation (Creates 2 Rebirth nodes and enqueues them)
          await autopool3x3Service.processDepositSuccessForAutoPool(deposit, session);

          // 3. Distribute sponsor and level income to uplines
          await distributeDepositIncome({
            userId: user._id,
            depositId: deposit._id,
            depositDoc: deposit,
            session,
          });

          await session.commitTransaction();

          // 4. Stabilize event queue sequentially until all enqueued items are placed
          await ensureAutopoolQueueUnlocked();
          console.log(`   ⚙️ Processing event queue for ${memberId}...`);
          let placedTotal = 0;
          let queueResult;
          do {
            queueResult = await autopool3x3Service.processNextQueueBatch(100);
            placedTotal += queueResult?.placedCount || 0;
          } while (queueResult && queueResult.placedCount > 0);

          console.log(`   ✨ Stabilized. Placed ${placedTotal} nodes.`);
          success = true;
        } catch (err) {
          await session.abortTransaction().catch(() => null);
          
          if (err.hasErrorLabel && err.hasErrorLabel("TransientTransactionError") && retryCount < maxRetries - 1) {
            retryCount++;
            const delay = Math.pow(2, retryCount) * 100;
            console.warn(`   ⚠️ Transient write conflict. Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            throw err;
          }
        } finally {
          session.endSession();
        }
      }
    }

    console.log("\n================================================================");
    console.log("🎉 EVENT-DRIVEN SEQUENTIAL SEEDING COMPLETED SUCCESSFULLY!");
    console.log("   All users are active and the event-queue remains fully stable.");
    console.log("================================================================");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Critical Error during seeding:", error);
    process.exit(1);
  }
}

run();
