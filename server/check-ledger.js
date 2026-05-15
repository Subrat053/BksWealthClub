import mongoose from "mongoose";
import { PoolFundLedger } from "./src/modules/autopool/pool-fund-ledger.model.js";
import dotenv from "dotenv";

dotenv.config();

async function checkLedger() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  const counts = await PoolFundLedger.aggregate([
    { $group: { _id: "$type", count: { $sum: 1 }, totalAmount: { $sum: "$amount" } } }
  ]);

  console.log("Ledger Stats:", JSON.stringify(counts, null, 2));

  const sample = await PoolFundLedger.find().limit(5).lean();
  console.log("Sample Entry:", JSON.stringify(sample[0], null, 2));

  await mongoose.disconnect();
}

checkLedger();
