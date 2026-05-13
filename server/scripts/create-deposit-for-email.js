import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../src/modules/user/user.model.js";
import { DepositModel } from "../src/modules/deposit/deposit.model.js";

dotenv.config();

async function run() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: node create-deposit-for-email.js email@example.com");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || undefined });

  const user = await User.findOne({ email: email.toLowerCase().trim() }).lean();
  if (!user) {
    console.error("User not found: ", email);
    process.exit(1);
  }

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
