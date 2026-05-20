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

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../.env") });

async function findBestSponsor() {
  const potentialSponsors = await User.find({ status: "active" });
  if (potentialSponsors.length === 0) {
    throw new Error("Operational Admin not found");
  }

  // Find direct children counts for each active user to build a perfectly balanced wide tree
  const sponsorCounts = [];
  for (const sponsor of potentialSponsors) {
    const count = await User.countDocuments({ sponsorUserId: sponsor._id });
    sponsorCounts.push({ sponsor, count });
  }

  // Sort by count ascending, so we prioritize users with fewer referrals
  sponsorCounts.sort((a, b) => a.count - b.count);

  // Return the sponsor with the minimum number of referrals
  return sponsorCounts[0].sponsor;
}

async function seed() {
  try {
    const args = process.argv.slice(2);
    let count = 10; // Default count if none is specified

    for (const arg of args) {
      if (arg.startsWith("--count=")) {
        const parsed = parseInt(arg.split("=")[1], 10);
        if (!isNaN(parsed) && parsed > 0) count = parsed;
      } else if (!arg.startsWith("-")) {
        const parsed = parseInt(arg, 10);
        if (!isNaN(parsed) && parsed > 0) count = parsed;
      }
    }

    console.log("==================================================");
    console.log(`🚀 STARTING USER SEEDING PROCESS: Seeding ${count} Users`);
    console.log("==================================================");

    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI environment variable is missing");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // 1. Ensure Operational Admin exists
    let adminUser = await User.findOne({ isOperationalAdmin: true });
    if (!adminUser) {
      console.log("ℹ️ Operational Admin not found. Seeding first...");
      await seedOperationalAdmin();
      adminUser = await User.findOne({ isOperationalAdmin: true });
    }

    console.log(`ℹ️ Root Sponsor: ${adminUser.fullName} (${adminUser.memberId})`);
    console.log(`🌱 Generating users sequentially...`);

    const firstNames = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen", "Mark", "Lisa", "Matthew", "Nancy", "Donald", "Sandra"];
    const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez"];

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

          // Trigger autopool activation (MAIN + 2 Rebirth nodes)
          await autopool3x3Service.processDepositSuccessForAutoPool(deposit, session);

          // Distribute level income to uplines
          await distributeDepositIncome({
            userId: user._id,
            depositId: deposit._id,
            depositDoc: deposit,
            session,
          });

          await session.commitTransaction();
          console.log(`  ✨ [${i}/${count}] Seeded User: ${fullName} (${memberId}) | Sponsored by: ${sponsorUser.memberId}`);
          success = true;
        } catch (err) {
          await session.abortTransaction();
          
          // Retry on transient errors
          if (err.hasErrorLabel && err.hasErrorLabel("TransientTransactionError") && retryCount < maxRetries - 1) {
            retryCount++;
            const delay = Math.pow(2, retryCount) * 100; // Exponential backoff
            console.log(`  ⚠️  Transient error, retrying in ${delay}ms... (Attempt ${retryCount}/${maxRetries - 1})`);
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            throw err;
          }
        } finally {
          session.endSession();
        }
      }
    }

    console.log("\n⚙️  Processing AutoPool queue to place all nodes in the tree...");
    const queueResult = await autopool3x3Service.processAutoPoolQueue();
    console.log(`✅ Queue processed. Placed ${queueResult.placedCount} nodes successfully!`);

    console.log("\n==================================================");
    console.log("🎉 SEEDING COMPLETE: Database successfully populated!");
    console.log("==================================================");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Critical Error during seeding:", error);
    process.exit(1);
  }
}

seed();
