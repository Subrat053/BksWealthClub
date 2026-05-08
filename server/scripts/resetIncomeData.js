/**
 * resetIncomeData.js
 *
 * ONE-TIME script to fix incorrectly distributed income data.
 *
 * What it does:
 *  1. Clears the SuperAdminFund singleton (resets all fund balances to 0)
 *  2. Clears all IncomeTransaction documents
 *  3. Clears all Rebirth documents
 *  4. Resets incomeDistributed = false on all Deposits
 *  5. Resets withdrawableFund = 0 on all Wallets
 *
 * After running this, you can re-approve the deposits from the admin panel
 * and the corrected distribution logic will run fresh.
 *
 * Usage:
 *   node scripts/resetIncomeData.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function main() {
  if (!MONGO_URI) {
    console.error("❌  MONGODB_URI not set in .env");
    process.exit(1);
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);
  console.log("✅  Connected\n");

  const db = mongoose.connection.db;

  // 1. Reset SuperAdminFund
  const saResult = await db.collection("superadminfunds").updateMany(
    {},
    { $set: { companyFund: 0, achieverFund: 0, adminFund: 0, leftoverFund: 0 } }
  );
  console.log(`SuperAdminFund reset: ${saResult.modifiedCount} document(s)`);

  // 2. Clear all IncomeTransactions
  const itResult = await db.collection("incometransactions").deleteMany({});
  console.log(`IncomeTransactions deleted: ${itResult.deletedCount}`);

  // 3. Clear all Rebirth documents
  const rbResult = await db.collection("rebirths").deleteMany({});
  console.log(`Rebirths deleted: ${rbResult.deletedCount}`);

  // 4. Reset incomeDistributed on all Deposits
  const depResult = await db.collection("deposits").updateMany(
    {},
    { $set: { incomeDistributed: false, distributedAt: null } }
  );
  console.log(`Deposits reset: ${depResult.modifiedCount}`);

  // 5. Reset withdrawableFund on all Wallets
  const walResult = await db.collection("wallets").updateMany(
    {},
    { $set: { withdrawableFund: 0 } }
  );
  console.log(`Wallets reset (withdrawableFund → 0): ${walResult.modifiedCount}`);

  console.log("\n✅  Income data reset complete.");
  console.log("👉  Now re-approve deposits from the admin panel to re-run distribution.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("❌  Error:", err.message);
  process.exit(1);
});
