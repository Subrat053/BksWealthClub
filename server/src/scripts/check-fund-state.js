import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

const schema = new mongoose.Schema({}, { strict: false });
const AutopoolUserFund = mongoose.model("AutopoolUserFund", schema, "autopooluserfunds");
const AutopoolFundTransaction = mongoose.model("AutopoolFundTransaction", new mongoose.Schema({}, { strict: false }), "autopooluserfundtransactions");
const AutoPoolNode = mongoose.model("AutoPoolNode", new mongoose.Schema({}, { strict: false }), "autopoolnodes");
const User = mongoose.model("User", new mongoose.Schema({}, { strict: false }), "users");

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected\n");

  // 1. Show all fund records
  console.log("══════════════════════════════════════════════");
  console.log("  AutopoolUserFund Records (ALL USERS)");
  console.log("══════════════════════════════════════════════");
  const funds = await AutopoolUserFund.find().lean();
  if (funds.length === 0) {
    console.log("  ⚠️  No AutopoolUserFund records found.");
  }
  for (const fund of funds) {
    const user = await User.findById(fund.userId).select("memberId fullName").lean();
    console.log(`\n  User: ${user?.fullName || "?"} (${user?.memberId || fund.userId})`);
    console.log(`    completedAutopoolLevel : ${fund.completedAutopoolLevel}`);
    console.log(`    lastCompletedRound     : ${fund.lastCompletedRound}`);
    console.log(`    poolFundTotal          : $${fund.poolFundTotal}`);
    console.log(`    reinvestmentFundTotal  : $${fund.reinvestmentFundTotal}`);
    console.log(`    withdrawableAutopoolFund: $${fund.withdrawableAutopoolFund}`);
    console.log(`    upgradeIdCount         : ${fund.upgradeIdCount}`);
  }

  // 2. Show all fund transactions
  console.log("\n══════════════════════════════════════════════");
  console.log("  AutopoolFundTransactions (should be NONE for Level 0)");
  console.log("══════════════════════════════════════════════");
  const txns = await AutopoolFundTransaction.find().lean();
  if (txns.length === 0) {
    console.log("  ✅ CORRECT: No fund transactions found. Level 0 generates no fund credits.");
  } else {
    console.log(`  ⚠️  Found ${txns.length} transactions:`);
    for (const tx of txns) {
      console.log(`    completedLevel=${tx.completedLevel}  type=${tx.type}  amount=$${tx.amount}`);
    }
  }

  // 3. Show completed nodes
  console.log("\n══════════════════════════════════════════════");
  console.log("  Completed AutoPool Nodes");
  console.log("══════════════════════════════════════════════");
  const completedNodes = await AutoPoolNode.find({ status: "COMPLETED" }).lean();
  
  if (completedNodes.length === 0) {
    console.log("  No completed nodes yet.");
  } else {
    for (const n of completedNodes) {
      console.log(`  [L${n.levelNumber}] ${n.nodeCode} → owner: ${n.ownerMemberId || "?"}`);
    }
  }

  await mongoose.disconnect();
  console.log("\n✅ Done.");
  process.exit(0);
}

check().catch((e) => { console.error(e); process.exit(1); });
