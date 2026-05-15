import mongoose from "mongoose";
import { PoolFundLedger } from "./src/modules/autopool/pool-fund-ledger.model.js";
import dotenv from "dotenv";

dotenv.config();

async function checkLedgerDetail() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const all = await PoolFundLedger.find().lean();
  console.log("Types found:");
  all.forEach(a => console.log(`'${a.type}'`));

  const aggregationTest = await PoolFundLedger.aggregate([
    { $match: { type: "REBIRTH_AUTOPOOL_COMPLETED" } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);
  console.log("Aggregation Test (REBIRTH):", aggregationTest);

  const reinvestTest = await PoolFundLedger.aggregate([
    { $match: { type: "REINVEST_TO_POOL_FUND" } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);
  console.log("Aggregation Test (REINVEST):", reinvestTest);

  await mongoose.disconnect();
}

checkLedgerDetail();
