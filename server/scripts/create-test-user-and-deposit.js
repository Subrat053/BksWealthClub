import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../src/modules/user/user.model.js";
import { DepositModel } from "../src/modules/deposit/deposit.model.js";

dotenv.config();

async function run() {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI missing in env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || undefined });

  // Create test user
  const email = "testuser2@example.com";
  let user = await User.findOne({ email }).lean();
  if (!user) {
    const created = await User.create({
      fullName: "Test User 2",
      email,
      passwordHash: "", // admin-created users may require passwordHash; set blank if not used
      memberId: `BKS${Math.floor(100000 + Math.random() * 900000)}`,
      isActive: true,
      isActivated: false,
    });
    user = created.toObject();
    console.log("Created user", user._id);
  } else {
    console.log("User exists", user._id);
  }

  // Create pending deposit
  const deposit = await DepositModel.create({
    userRef: user._id,
    amount: 75,
    walletType: "USDT",
    txHash: `test-tx-${Date.now()}`,
    status: "pending",
    processingStatus: "PENDING",
    proof: { url: "", publicId: "" },
  });

  console.log("Created deposit", deposit._id);
  await mongoose.disconnect();
}

run().catch((err) => { console.error(err); process.exit(1); });
