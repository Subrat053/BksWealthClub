import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

async function healthCheck() {
  await mongoose.connect(process.env.MONGODB_URI);

  const db = mongoose.connection.db;

  const [
    totalUsers,
    totalNodes,
    pendingNodes,
    placedNodes,
    completedNodes,
    totalRebirthIds,
    totalFundRecords,
    totalFundTxns,
    brokenNodes,
  ] = await Promise.all([
    db.collection("users").countDocuments(),
    db.collection("autopoolnodes").countDocuments(),
    db.collection("autopoolnodes").countDocuments({ status: "PENDING" }),
    db.collection("autopoolnodes").countDocuments({ status: "PLACED" }),
    db.collection("autopoolnodes").countDocuments({ status: "COMPLETED" }),
    db.collection("rebirthids").countDocuments(),
    db.collection("autopooluserfunds").countDocuments(),
    db.collection("autopooluserfundtransactions").countDocuments(),
    db.collection("autopoolnodes").countDocuments({
      nodeType: "REBIRTH",
      status: "COMPLETED",
      rebirthGenerated: false,
    }),
  ]);

  // Fund records should have $0 for level-0-only completions
  const fundsWithMoney = await db.collection("autopooluserfunds").countDocuments({
    $or: [
      { poolFundTotal: { $gt: 0 } },
      { reinvestmentFundTotal: { $gt: 0 } },
      { withdrawableAutopoolFund: { $gt: 0 } },
    ],
  });

  // Level-wise node breakdown
  const levelBreakdown = await db.collection("autopoolnodes").aggregate([
    { $match: { nodeType: "REBIRTH" } },
    { $group: { _id: "$levelNumber", count: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] } } } },
    { $sort: { _id: 1 } },
  ]).toArray();

  console.log("\n══════════════════════════════════════════════════════");
  console.log("  🏥 AUTOPOOL HEALTH CHECK");
  console.log("══════════════════════════════════════════════════════");
  console.log(`  Total users         : ${totalUsers} (incl. admin)`);
  console.log(`  Total AutoPool nodes: ${totalNodes}`);
  console.log(`    → PENDING         : ${pendingNodes}`);
  console.log(`    → PLACED          : ${placedNodes}`);
  console.log(`    → COMPLETED       : ${completedNodes}`);
  console.log(`  Total RebirthIds    : ${totalRebirthIds}`);
  console.log(`  AutopoolUserFunds   : ${totalFundRecords}`);
  console.log(`  Fund transactions   : ${totalFundTxns}`);
  console.log(`  Funds with $>0      : ${fundsWithMoney} users`);
  console.log(`  ⚠️  Broken nodes (completed, rebirthGenerated=false): ${brokenNodes}`);

  console.log("\n  Level-wise REBIRTH node breakdown:");
  for (const l of levelBreakdown) {
    const pct = l.count > 0 ? Math.round((l.completed / l.count) * 100) : 0;
    console.log(`    Level ${l._id}: ${l.completed}/${l.count} completed (${pct}%)`);
  }

  if (brokenNodes === 0) {
    console.log("\n  ✅ No broken nodes — all completed rebirths have generated next-level children.");
  } else {
    console.log(`\n  ⚠️  ${brokenNodes} nodes need repair. Run: npm run repair:rebirths`);
  }

  // Check fund correctness: Level 0 completions should not have $120 credits
  const wrongFunds = await db.collection("autopooluserfundtransactions").countDocuments({
    completedLevel: 0,
    type: "POOL_FUND_CREDIT",
  });
  if (wrongFunds === 0) {
    console.log("  ✅ Fund bug fixed — no Level-0 POOL_FUND_CREDIT transactions found.");
  } else {
    console.log(`  ❌ Fund bug still present — ${wrongFunds} incorrect Level-0 fund transactions found.`);
  }

  console.log("══════════════════════════════════════════════════════\n");

  await mongoose.disconnect();
  process.exit(0);
}

healthCheck().catch((e) => { console.error(e); process.exit(1); });
