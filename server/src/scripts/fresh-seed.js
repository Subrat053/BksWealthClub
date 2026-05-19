import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { User } from "../modules/user/user.model.js";
import { WalletModel } from "../modules/user/wallet.model.js";
import { DepositModel } from "../modules/deposit/deposit.model.js";
import { WithdrawalModel } from "../modules/withdrawal/withdrawal.model.js";
import { AutoPoolNode } from "../modules/autopool/autopool-matrix.model.js";
import { RebirthId } from "../modules/autopool/rebirth.model.js";
import { AutoPoolLevelCompletion } from "../modules/autopool/autopool-level-completion.model.js";
import { IncomeLedgerModel } from "../modules/income/income.model.js";
import { ReferralTree } from "../modules/referral/referral-tree.model.js";
import { seedOperationalAdmin } from "../modules/admin/seedOperationalAdmin.js";
import { logger } from "../common/logger/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, "../../.env") });

async function clearAndSeed() {
  try {
    console.log("--------------------------------------------------");
    console.log("🔥 WARNING: CLEARING ALL DATABASE DATA 🔥");
    console.log("--------------------------------------------------");

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const collections = [
      "users",
      "wallets",
      "deposits",
      "withdrawals",
      "autopoolnodes",
      "autopoolqueues",
      "autopoollocks",
      "autopoolcounters",
      "autopoollevelcounters",
      "autopoollevelcompletions",
      "rebirthids",
      "rebirths",
      "incomeledgers",
      "incometransactions",
      "superadminfunds",
      "referraltrees",
      "referralrelations",
      "activations",
      "userprofiles",
      "auditlogs",
      "notifications",
      "otps",
      "emailverifications",
      "passwordresets",
      "poolfundledgers",
      "companyfunds",
      "companyfundentries"
    ];

    for (const col of collections) {
      try {
        await mongoose.connection.db.dropCollection(col);
        console.log(`🗑️  Dropped collection: ${col}`);
      } catch (err) {
        if (err.code === 26) {
          console.log(`ℹ️  Collection ${col} does not exist, skipping.`);
        } else {
          console.warn(`⚠️  Error dropping ${col}:`, err.message);
        }
      }
    }

    console.log("\n🌱 Starting Fresh Seeding...");

    // 1. Seed Operational Admin (This will create User, Referral Node, and AutoPool Root)
    await seedOperationalAdmin();
    console.log("✅ Operational Admin & AutoPool Root seeded.");

    console.log("\n✨ DATABASE RESET COMPLETE ✨");
    console.log("--------------------------------------------------");
    process.exit(0);
  } catch (error) {
    console.error("❌ Critical Error during seeding:", error);
    process.exit(1);
  }
}

clearAndSeed();
