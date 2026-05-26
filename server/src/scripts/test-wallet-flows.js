import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { User } from "../modules/user/user.model.js";
import { walletService } from "../modules/wallet/wallet.service.js";
import { WalletSummaryModel } from "../modules/wallet/wallet-summary.model.js";
import { WalletLedgerModel } from "../modules/wallet/wallet-ledger.model.js";
import { WalletTransferModel } from "../modules/wallet/wallet-transfer.model.js";
import { WithdrawalRequestModel } from "../modules/wallet/withdrawal-request.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, "../../.env") });

async function runTests() {
  console.log("==================================================");
  console.log("🧪 WALLET & WITHDRAWAL TRANSACTION TESTS 🧪");
  console.log("==================================================");

  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI not found in env configuration.");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB successfully.");

    // ─── SETUP CLEAN STATE ───
    console.log("\n🧹 Cleaning up test accounts...");

    // Find or create test users
    let testUserA = await User.findOne({ email: "test_wallet_user_a@example.com" });
    if (testUserA) {
      await WalletSummaryModel.deleteOne({ userId: testUserA._id });
      await WalletLedgerModel.deleteMany({ userId: testUserA._id });
      await WalletTransferModel.deleteMany({
        $or: [{ senderUserId: testUserA._id }, { receiverUserId: testUserA._id }]
      });
      await WithdrawalRequestModel.deleteMany({ userId: testUserA._id });
      testUserA.status = "active";
      testUserA.isActivated = true;
      await testUserA.save();
    } else {
      testUserA = await User.create({
        memberId: "BKS_TEST_A",
        fullName: "Test User Alice",
        email: "test_wallet_user_a@example.com",
        phone: "+15555555555",
        passwordHash: "dummy",
        referralCode: "BKS_TEST_A",
        referralLink: "http://localhost:3000/register?ref=BKS_TEST_A",
        registrationSource: "admin",
        sponsorId: "BKS000000",
        status: "active",
        isActivated: true,
      });
    }

    let testUserB = await User.findOne({ email: "test_wallet_user_b@example.com" });
    if (testUserB) {
      await WalletSummaryModel.deleteOne({ userId: testUserB._id });
      await WalletLedgerModel.deleteMany({ userId: testUserB._id });
      await WithdrawalRequestModel.deleteMany({ userId: testUserB._id });
      testUserB.status = "active";
      testUserB.isActivated = true;
      await testUserB.save();
    } else {
      testUserB = await User.create({
        memberId: "BKS_TEST_B",
        fullName: "Test User Bob",
        email: "test_wallet_user_b@example.com",
        phone: "+15555555556",
        passwordHash: "dummy",
        referralCode: "BKS_TEST_B",
        referralLink: "http://localhost:3000/register?ref=BKS_TEST_B",
        registrationSource: "admin",
        sponsorId: "BKS000000",
        status: "active",
        isActivated: true,
      });
    }

    const aliceId = testUserA._id;
    const bobId = testUserB._id;

    console.log(`👤 Test User Alice: ID = ${aliceId}, MemberID = BKS_TEST_A`);
    console.log(`👤 Test User Bob:   ID = ${bobId}, MemberID = BKS_TEST_B`);

    // ─── INITIAL CREDITS VIA HOOKS ───
    console.log("\n🌱 Seeding initial balances using wallet hooks...");
    
    // Credit Alice with some Autopool & Sponsor Income
    await walletService.creditAutopoolWithdrawable(aliceId, 150, "EVENT_INIT_POOL");
    await walletService.creditSponsorIncome(aliceId, 50, "EVENT_INIT_SPONSOR");
    // Alice balance is now: 150 + 50 = 200 USDT. available = 200.

    // Credit Bob with some Level Income
    await walletService.creditLevelIncome(bobId, 50, "EVENT_INIT_LEVEL");
    // Bob balance is now: 50 USDT. available = 50.

    let aliceSummary = await walletService.getSummary(aliceId);
    console.log(`✅ Alice availableBalance: $${aliceSummary.availableBalance} USDT`);
    if (aliceSummary.availableBalance !== 200) {
      throw new Error(`Expected Alice availableBalance to be 200, got ${aliceSummary.availableBalance}`);
    }

    let bobSummary = await walletService.getSummary(bobId);
    console.log(`✅ Bob availableBalance:   $${bobSummary.availableBalance} USDT`);
    if (bobSummary.availableBalance !== 50) {
      throw new Error(`Expected Bob availableBalance to be 50, got ${bobSummary.availableBalance}`);
    }

    // ==================================================
    // TEST 1: Alice (balance 200) withdraws 100.
    // Fee 5% = 5. Total debit = 105. Remaining = 95. (Allowed).
    // ==================================================
    console.log("\n🧪 TEST 1: Alice (balance 200) requests withdrawal of 100 (5% charge)...");
    const withdraw1 = await walletService.createWithdrawalRequest({
      userId: aliceId,
      requestedAmount: 100,
      walletAddress: "0xTRXAliceUSDTAddressTRC20",
      network: "TRC20",
      userNote: "Alice Test 1",
    });

    aliceSummary = await walletService.getSummary(aliceId);
    console.log(`   - Locked balance: $${aliceSummary.lockedWithdrawalBalance}`);
    console.log(`   - Available balance: $${aliceSummary.availableBalance}`);
    if (aliceSummary.lockedWithdrawalBalance !== 105) {
      throw new Error(`Expected locked balance to be 105, got ${aliceSummary.lockedWithdrawalBalance}`);
    }
    if (aliceSummary.availableBalance !== 95) {
      throw new Error(`Expected available balance to be 95, got ${aliceSummary.availableBalance}`);
    }
    console.log("✅ TEST 1 passed successfully!");

    // ==================================================
    // TEST 2: Alice (remaining available balance 95) tries to withdraw 80.
    // Fee 5% = 4. Total debit = 84. Remaining available would be 95 - 84 = 11.
    // This is less than 20. (Blocked).
    // ==================================================
    console.log("\n🧪 TEST 2: Alice (available 95) tries to withdraw 80 (Total debit 84, remaining would be 11 < 20)...");
    try {
      await walletService.createWithdrawalRequest({
        userId: aliceId,
        requestedAmount: 80,
        walletAddress: "0xTRXAliceUSDTAddressTRC20",
        network: "TRC20",
      });
      throw new Error("TEST 2 Failed: Payout request should have been blocked!");
    } catch (err) {
      console.log(`   - Received expected block error: "${err.message}"`);
      console.log("✅ TEST 2 passed (correctly blocked payout)!");
    }

    // ==================================================
    // TEST 3: Bob (balance 50) transfers 30 to Alice.
    // Remaining Bob balance = 50 - 30 = 20. (Allowed).
    // ==================================================
    console.log("\n🧪 TEST 3: Bob (balance 50) transfers 30 to Alice (remaining Bob balance = 20)...");
    const transfer1 = await walletService.walletTransfer({
      senderUserId: bobId,
      receiverMemberId: "BKS_TEST_A",
      amount: 30,
      note: "Bob sent 30 to Alice",
    });

    bobSummary = await walletService.getSummary(bobId);
    aliceSummary = await walletService.getSummary(aliceId);
    console.log(`   - Bob availableBalance:   $${bobSummary.availableBalance}`);
    console.log(`   - Alice availableBalance: $${aliceSummary.availableBalance} (was 95, + 30 = 125)`);
    if (bobSummary.availableBalance !== 20) {
      throw new Error(`Expected Bob balance to be 20, got ${bobSummary.availableBalance}`);
    }
    if (aliceSummary.availableBalance !== 125) {
      throw new Error(`Expected Alice balance to be 125, got ${aliceSummary.availableBalance}`);
    }
    console.log("✅ TEST 3 passed successfully!");

    // ==================================================
    // TEST 4: Bob (remaining available balance 20) tries to transfer 5 to Alice.
    // Remaining Bob balance would be 20 - 5 = 15 < 20. (Blocked).
    // ==================================================
    console.log("\n🧪 TEST 4: Bob (available 20) tries to transfer 5 to Alice (remaining 15 < 20)...");
    try {
      await walletService.walletTransfer({
        senderUserId: bobId,
        receiverMemberId: "BKS_TEST_A",
        amount: 5,
      });
      throw new Error("TEST 4 Failed: Transfer should have been blocked!");
    } catch (err) {
      console.log(`   - Received expected block error: "${err.message}"`);
      console.log("✅ TEST 4 passed (correctly blocked transfer)!");
    }

    // ==================================================
    // TEST 5: Reject withdrawal unlocks balance.
    // Reject Alice's withdrawal from Test 1.
    // Alice locked balance goes 105 -> 0. available goes 125 -> 230.
    // ==================================================
    console.log("\n🧪 TEST 5: Reject Alice's withdrawal (unlocks $105 back to available)...");
    const rejectedReq = await walletService.rejectWithdrawalRequest({
      withdrawalId: withdraw1._id,
      adminId: aliceId, // dummy admin ID
      reason: "Test rejection reason",
    });

    aliceSummary = await walletService.getSummary(aliceId);
    console.log(`   - Alice lockedBalance:    $${aliceSummary.lockedWithdrawalBalance}`);
    console.log(`   - Alice availableBalance: $${aliceSummary.availableBalance}`);
    if (aliceSummary.lockedWithdrawalBalance !== 0) {
      throw new Error(`Expected locked balance to be 0, got ${aliceSummary.lockedWithdrawalBalance}`);
    }
    if (aliceSummary.availableBalance !== 230) {
      throw new Error(`Expected available balance to be 230, got ${aliceSummary.availableBalance}`);
    }
    console.log("✅ TEST 5 passed successfully!");

    // ==================================================
    // TEST 6: Paid withdrawal locks amount + admin fee permanently.
    // We create another withdrawal request for Alice, then approve, then mark paid.
    // Alice balance 230. Withdraw 100 + fee 5 = 105 total debit. available balance goes to 125.
    // ==================================================
    console.log("\n🧪 TEST 6: Alice requests withdrawal of 100 again, and admin marks it as PAID...");
    const withdraw2 = await walletService.createWithdrawalRequest({
      userId: aliceId,
      requestedAmount: 100,
      walletAddress: "0xTRXAliceUSDTAddressTRC20",
      network: "TRC20",
    });
    
    // Approve
    await walletService.approveWithdrawalRequest({
      withdrawalId: withdraw2._id,
      adminId: bobId, // dummy admin ID
    });

    // Mark Paid
    await walletService.markPaidWithdrawalRequest({
      withdrawalId: withdraw2._id,
      adminId: bobId,
      txHash: "TRX_HASH_SUCCESS_ALICE_TEST_100",
      adminNote: "Dispatched to Tron",
    });

    aliceSummary = await walletService.getSummary(aliceId);
    console.log(`   - Alice lockedBalance:    $${aliceSummary.lockedWithdrawalBalance}`);
    console.log(`   - Alice availableBalance: $${aliceSummary.availableBalance}`);
    console.log(`   - Alice lifetimeWithdrawn: $${aliceSummary.lifetimeWithdrawn}`);
    console.log(`   - Alice lifetimeCharges:   $${aliceSummary.lifetimeAdminCharges}`);
    
    if (aliceSummary.lockedWithdrawalBalance !== 0) {
      throw new Error(`Expected locked balance to be 0, got ${aliceSummary.lockedWithdrawalBalance}`);
    }
    if (aliceSummary.availableBalance !== 125) {
      throw new Error(`Expected available balance to be 125, got ${aliceSummary.availableBalance}`);
    }
    if (aliceSummary.lifetimeWithdrawn !== 100) {
      throw new Error(`Expected lifetimeWithdrawn to be 100, got ${aliceSummary.lifetimeWithdrawn}`);
    }
    if (aliceSummary.lifetimeAdminCharges !== 5) {
      throw new Error(`Expected lifetimeAdminCharges to be 5, got ${aliceSummary.lifetimeAdminCharges}`);
    }
    console.log("✅ TEST 6 passed successfully!");

    // ==================================================
    // TEST 7: Ledger auditable checks
    // Verify that every single debit, credit, lock, and unlock has logged in the Ledger.
    // ==================================================
    console.log("\n🧪 TEST 7: Auditing Alice's ledger history...");
    const ledgerLogs = await walletService.getLedger(aliceId);
    console.log(`   - Alice has logged ${ledgerLogs.total} immutable ledger entries.`);
    
    for (const log of ledgerLogs.logs) {
      console.log(`     [${log.direction}] ${log.type} | Amount: $${log.amount} | Before: $${log.balanceBefore} -> After: $${log.balanceAfter}`);
    }

    if (ledgerLogs.total < 5) {
      throw new Error(`Expected Alice to have at least 5 ledger entries, got ${ledgerLogs.total}`);
    }
    console.log("✅ TEST 7 passed successfully!");

    // ─── TEARDOWN TEST DATA ───
    console.log("\n🧹 Tearing down temporary test database data...");
    await WalletSummaryModel.deleteOne({ userId: aliceId });
    await WalletSummaryModel.deleteOne({ userId: bobId });
    await WalletLedgerModel.deleteMany({ userId: aliceId });
    await WalletLedgerModel.deleteMany({ userId: bobId });
    await WalletTransferModel.deleteMany({
      $or: [{ senderUserId: aliceId }, { receiverUserId: aliceId }]
    });
    await WithdrawalRequestModel.deleteMany({ userId: aliceId });
    await WithdrawalRequestModel.deleteMany({ userId: bobId });
    await User.deleteOne({ _id: aliceId });
    await User.deleteOne({ _id: bobId });

    console.log("\n==================================================");
    console.log("🎉 ALL WALLET INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉");
    console.log("==================================================");

    mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ TEST SUITE FAILURE:", error);
    mongoose.disconnect();
    process.exit(1);
  }
}

runTests();
