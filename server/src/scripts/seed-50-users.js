import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { User } from "../modules/user/user.model.js";
import { DepositModel } from "../modules/deposit/deposit.model.js";
import { depositService } from "../modules/deposit/deposit.service.js";
import { hashPassword } from "../common/helpers/password.helper.js";
import { generateMemberId } from "../utils/generateMemberId.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, "../../.env") });

async function seed50Users() {
  try {
    console.log("--------------------------------------------------");
    console.log("🌱 STARTING 50 USERS SIMULATED FLOW SEEDING 🌱");
    console.log("--------------------------------------------------");

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // 1. Fetch admin/root user
    const adminUser = await User.findOne({ memberId: "BKS000000" });
    if (!adminUser) {
      console.error("❌ Operational Admin BKS000000 not found! Please run fresh-seed first.");
      process.exit(1);
    }
    console.log(`✅ Found Admin: ${adminUser.fullName} (${adminUser.memberId})`);

    const passwordHash = await hashPassword("UserPassword@123");
    
    // We will sponsor them in a balanced referral tree.
    // Parent index = Math.floor((i - 1) / 3) -> gives a balanced 3-child tree.
    const userPool = [adminUser];

    console.log(`\n👥 Registering, depositing, and approving 50 users...`);

    for (let i = 1; i <= 50; i++) {
      // Pick a sponsor from the pool
      const sponsorIndex = Math.floor((i - 1) / 3);
      const sponsor = userPool[sponsorIndex] || adminUser;

      const memberId = await generateMemberId();
      const email = `user${i}_${memberId.toLowerCase()}@bkswealthclub.local`;
      const fullName = `Simulated User ${i}`;

      // A. Create User
      const user = await User.create({
        memberId,
        sponsorId: sponsor.memberId,
        sponsorUserId: sponsor._id,
        referredByUserId: sponsor._id,
        fullName,
        email,
        passwordHash,
        plainPassword: "UserPassword@123",
        referralCode: memberId,
        referralLink: `${process.env.BASE_URL || "http://localhost:3000"}/register?ref=${memberId}`,
        registrationSource: "website",
        status: "pending",
        isEmailVerified: true,
        isActivated: false,
        isActive: false,
        activationStatus: "PENDING_DEPOSIT",
      });

      // Also create referral tree node inside database
      try {
        const { referralService } = await import("../modules/referral/referral.service.js");
        await referralService.createReferralTreeNode({
          userId: user._id,
          sponsorUserId: sponsor._id,
        });
      } catch (err) {
        console.error(`[Error] Failed to create referral tree node for ${memberId}:`, err.message);
      }

      // B. Create $75 Deposit
      const deposit = await DepositModel.create({
        userRef: user._id,
        amount: 75,
        walletType: "main",
        txHash: `tx_hash_simulated_${i}_${memberId}`,
        status: "pending",
        processingStatus: "PENDING",
      });

      // C. Approve Deposit (Triggers activation, rebirths generation, queue placement, and commissions!)
      console.log(`[Flow] [${i}/50] Processing ${fullName} (${memberId}) sponsored by ${sponsor.memberId}...`);
      
      let approvalResult;
      let success = false;
      let attempts = 0;

      while (!success && attempts < 10) {
        try {
          attempts++;
          approvalResult = await depositService.approveRequest({
            depositId: deposit._id,
            adminId: adminUser._id,
          });
          success = true;
        } catch (err) {
          if (attempts >= 10) throw err;
          console.warn(`  [Warning] Attempt ${attempts} failed: ${err.message}. Retrying in 2.5s...`);
          await new Promise((resolve) => setTimeout(resolve, 2500));
        }
      }

      console.log(`  ✓ Deposit approved. Activated: ${approvalResult.activated}`);

      // Add to pool so they can sponsor subsequent users
      userPool.push(user);

      // Brief delay to let the background setImmediate processAutoPoolQueue run cleanly
      await new Promise((resolve) => setTimeout(resolve, 2500));
    }

    console.log("\n✨ 50 USERS FLOW SIMULATION SEED COMPLETE ✨");
    console.log("--------------------------------------------------");
    process.exit(0);
  } catch (error) {
    console.error("❌ Critical Error during flow seeding:", error);
    process.exit(1);
  }
}

seed50Users();
