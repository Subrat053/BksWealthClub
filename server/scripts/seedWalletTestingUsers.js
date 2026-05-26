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
import { hashPassword } from "../src/common/helpers/password.helper.js";
import { seedOperationalAdmin } from "../src/modules/admin/seedOperationalAdmin.js";
import { AutopoolRepairLock } from "../src/modules/autopool/autopool-repair-lock.model.js";
import { releaseAutopoolRepairLock } from "../src/modules/autopool/autopool-repair-lock.service.js";
import { walletService, recalculateBalances, getOrCreateSummary } from "../src/modules/wallet/wallet.service.js";
import { WalletSummaryModel } from "../src/modules/wallet/wallet-summary.model.js";
import { WalletLedgerModel } from "../src/modules/wallet/wallet-ledger.model.js";
import { RebirthId } from "../src/modules/autopool/rebirth.model.js";
import { AutoPoolQueue } from "../src/modules/autopool/autopool-queue.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, "../.env") });

const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;

async function run() {
  try {
    console.log("==================================================================");
    console.log("⚙️  MLM/AUTOPOOL BALANCE & DISPATCH TESTING SEEDER");
    console.log("==================================================================");

    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not set in env configuration.");
    }

    await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || undefined });
    console.log("✅ Connected to MongoDB successfully.");

    // Handle Optional RESET Argument
    const args = process.argv.slice(2);
    const shouldReset = args.includes("--reset-testing-wallets");

    if (shouldReset) {
      console.log("\n🧹 Option --reset-testing-wallets detected. Resetting testing adjustment credits...");
      const targetMemberIds = ["BKS00345", "BKS00346", "BKS00347", "BKS00348"];
      
      for (const memberId of targetMemberIds) {
        const user = await User.findOne({ memberId });
        if (user) {
          const summary = await WalletSummaryModel.findOne({ userId: user._id });
          if (summary) {
            // Find and sum all testing adjustment credits
            const adjustments = await WalletLedgerModel.find({
              userId: user._id,
              type: "ADMIN_ADJUSTMENT",
              description: "WALLET_TESTING_SEED",
            });
            
            const totalAdjustment = adjustments.reduce((sum, item) => sum + item.amount, 0);
            if (totalAdjustment > 0) {
              console.log(`   - Removing $${totalAdjustment.toFixed(2)} adjustment from ${memberId}...`);
              // Delete the ledger records
              await WalletLedgerModel.deleteMany({
                userId: user._id,
                type: "ADMIN_ADJUSTMENT",
                description: "WALLET_TESTING_SEED",
              });
              
              // Subtract from summary
              summary.sponsorIncomeBalance = round2(summary.sponsorIncomeBalance - totalAdjustment);
              recalculateBalances(summary);
              await summary.save();
              console.log(`   - ${memberId} reset successfully. Current Available: $${summary.availableBalance}`);
            } else {
              console.log(`   - No adjustment credits found for ${memberId}.`);
            }
          }
        }
      }
      console.log("✅ Reset complete. Exiting...");
      await mongoose.disconnect();
      process.exit(0);
    }

    // ─── 1. VERIFY ROOT OPERATIONAL ADMIN (BKS000000) ───
    let adminUser = await User.findOne({ memberId: "BKS000000" });
    if (!adminUser) {
      console.log("ℹ️ Admin user BKS000000 not found. Seeding operational admin root...");
      await seedOperationalAdmin();
      adminUser = await User.findOne({ memberId: "BKS000000" });
      if (!adminUser) {
        throw new Error("Admin seeding failed. BKS000000 is still missing.");
      }
    } else {
      console.log("✅ Verified operational admin BKS000000.");
    }

    // Lock Releasing Helper
    const ensureAutopoolQueueUnlocked = async () => {
      const lock = await AutopoolRepairLock.findOne({ key: "autopool_chronological_replay_v1", isLocked: true });
      if (!lock) return;
      console.warn(`   ⚠️ Releasing stale Autopool lock...`);
      await releaseAutopoolRepairLock({ lockedBy: lock.lockedBy });
    };

    // User Setup helper
    async function ensureTestUser({ memberId, sponsorId, sponsorUserId, referredByUserId, fullName, email, phone, passwordHash }) {
      const session = await mongoose.startSession();
      try {
        session.startTransaction();
        let user = await User.findOne({ memberId }).session(session);
        
        if (!user) {
          console.log(`\n🌱 Seeding new test user: ${fullName} (${memberId}) | Sponsor: ${sponsorId}`);
          
          const userDocs = await User.create([
            {
              memberId,
              sponsorId,
              sponsorUserId,
              referredByUserId,
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
            }
          ], { session });
          user = userDocs[0];

          // Initialize Wallet
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
            sponsorUserId,
          }, session);

          // Create Approved Activation Deposit
          const depositDocs = await DepositModel.create([
            {
              userRef: user._id,
              amount: 75,
              walletType: "USDT",
              txHash: `0x_testing_seed_tx_${memberId}_${Date.now()}`,
              proof: { url: "http://example.com/proof.png", publicId: "proof" },
              status: "approved",
              processingStatus: "COMPLETED",
              reviewedBy: sponsorUserId,
              reviewReason: "Testing seed activation",
              incomeDistributed: false,
              activationProcessed: false,
              autoPoolProcessed: false,
              rebirthProcessed: false,
            }
          ], { session });
          const deposit = depositDocs[0];

          // Trigger standard activation -> Creates Rebirth nodes and enqueues them
          await autopool3x3Service.processDepositSuccessForAutoPool(deposit, session);

          // Distribute sponsor / level incomes to uplines
          await distributeDepositIncome({
            userId: user._id,
            depositId: deposit._id,
            depositDoc: deposit,
            session,
          });

          await session.commitTransaction();
          console.log(`   - Test user ${memberId} successfully created, enqueued, and activated.`);
        } else {
          await session.abortTransaction();
          console.log(`✅ Test user ${fullName} (${memberId}) already exists.`);
        }
        return user;
      } catch (err) {
        await session.abortTransaction().catch(() => null);
        throw err;
      } finally {
        session.endSession();
      }
    }

    const passwordHash = await hashPassword("User@123");

    // ─── 2. SEED THE 4 TEST USERS SEQUENTIALLY ───
    // User 1: BKS00345 (Alice) sponsored by BKS000000
    const userAlice = await ensureTestUser({
      memberId: "BKS00345",
      sponsorId: "BKS000000",
      sponsorUserId: adminUser._id,
      referredByUserId: adminUser._id,
      fullName: "Alice Cooper",
      email: "alice.cooper@bkswealthclub.local",
      phone: "+15550000345",
      passwordHash,
    });

    // User 2: BKS00346 (Bob) sponsored by BKS00345
    const userBob = await ensureTestUser({
      memberId: "BKS00346",
      sponsorId: "BKS00345",
      sponsorUserId: userAlice._id,
      referredByUserId: userAlice._id,
      fullName: "Bob Marley",
      email: "bob.marley@bkswealthclub.local",
      phone: "+15550000346",
      passwordHash,
    });

    // User 3: BKS00347 (Charlie) sponsored by BKS00345
    const userCharlie = await ensureTestUser({
      memberId: "BKS00347",
      sponsorId: "BKS00345",
      sponsorUserId: userAlice._id,
      referredByUserId: userAlice._id,
      fullName: "Charlie Chaplin",
      email: "charlie.chaplin@bkswealthclub.local",
      phone: "+15550000347",
      passwordHash,
    });

    // User 4: BKS00348 (Dave) sponsored by BKS00346
    const userDave = await ensureTestUser({
      memberId: "BKS00348",
      sponsorId: "BKS00346",
      sponsorUserId: userBob._id,
      referredByUserId: userBob._id,
      fullName: "Dave Grohl",
      email: "dave.grohl@bkswealthclub.local",
      phone: "+15550000348",
      passwordHash,
    });

    // ─── 3. PROCESS THE AUTOPOOL EVENT-QUEUE SEQUENTIALLY ───
    console.log("\n⚙️ Processing enqueued nodes sequentially through FIFO Worker...");
    await ensureAutopoolQueueUnlocked();
    
    let pendingQueueExists = true;
    let iterations = 0;
    let placedTotalCount = 0;

    while (pendingQueueExists && iterations < 50) {
      const queueResult = await autopool3x3Service.processNextQueueBatch(10);
      if (!queueResult || queueResult.placedCount === 0) {
        pendingQueueExists = false;
      } else {
        placedTotalCount += queueResult.placedCount;
      }
      iterations++;
    }
    console.log(`✅ Worker processing finished. Placed ${placedTotalCount} nodes chronologically.`);

    // ─── 4. APPLY TARGET BALANCES ADJUSTMENTS ───
    console.log("\n💎 Calculating real balances and applying secure testing credits...");

    const targets = [
      { user: userAlice, memberId: "BKS00345", target: 150 },
      { user: userBob, memberId: "BKS00346", target: 100 },
      { user: userCharlie, memberId: "BKS00347", target: 80 },
      { user: userDave, memberId: "BKS00348", target: 50 },
    ];

    for (const t of targets) {
      const summary = await getOrCreateSummary(t.user._id);
      const currentAvailable = summary.availableBalance;
      
      if (currentAvailable < t.target) {
        const diff = round2(t.target - currentAvailable);
        console.log(`   - User ${t.memberId} Available = $${currentAvailable.toFixed(2)}. Adjusting with credit: +$${diff.toFixed(2)}`);
        
        // Execute proper walletService credit adjustment (records Ledger)
        await walletService.adminAdjustmentCredit(t.user._id, diff, "WALLET_TESTING_SEED");
      } else {
        console.log(`   - User ${t.memberId} Available = $${currentAvailable.toFixed(2)}. Meets or exceeds target of $${t.target}. No adjustment needed.`);
      }
    }

    // ─── 5. PRINT THE FINAL DETAILED SUMMARY ───
    console.log("\n================================================");
    console.log("USER WALLET TEST DATA");
    console.log("================================================");

    for (const t of targets) {
      const summary = await getOrCreateSummary(t.user._id);
      console.log(`\n${t.memberId} (${t.user.fullName})`);
      console.log(`Available Balance:     ${summary.availableBalance} USDT`);
      console.log(`Autopool Withdrawable: ${summary.autopoolWithdrawableBalance} USDT`);
      console.log(`Sponsor Income:        ${summary.sponsorIncomeBalance} USDT`);
      console.log(`Level Income:          ${summary.levelIncomeBalance} USDT`);
      console.log(`Transfers Received:    ${summary.walletTransferReceivedBalance} USDT`);
      console.log(`Transfers Sent:        ${summary.walletTransferSentBalance} USDT`);
      console.log(`Locked Withdrawal:     ${summary.lockedWithdrawalBalance} USDT`);
    }

    console.log("\n================================================");
    console.log("📊 SYSTEM QUEUE & REBIRTH STATS");
    console.log("================================================");

    const pendingQueueCount = await AutoPoolQueue.countDocuments({ status: "PENDING" });
    const totalRebirthCount = await RebirthId.countDocuments();
    const completedRebirthCount = await RebirthId.countDocuments({ status: "COMPLETED" });
    const generatedRebirthCount = await RebirthId.countDocuments({ sourceType: "AUTOPool_COMPLETION" });

    console.log(`Pending Queue Items:       ${pendingQueueCount}`);
    console.log(`Total Rebirth Nodes:       ${totalRebirthCount}`);
    console.log(`Completed Rebirth Nodes:   ${completedRebirthCount}`);
    console.log(`Generated Rebirth Nodes:   ${generatedRebirthCount}`);
    console.log("================================================\n");

    console.log("🎉 WALLET TESTING SEED FINISHED SUCCESSFULLY!");
    console.log("   Test accounts are ready and meet all verification thresholds.");
    console.log("   Execute manually: node scripts/seedWalletTestingUsers.js --reset-testing-wallets to clear adjustments.");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Critical Error during seeding:", error);
    await mongoose.disconnect().catch(() => null);
    process.exit(1);
  }
}

run();
