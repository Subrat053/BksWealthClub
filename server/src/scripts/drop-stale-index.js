import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

async function dropIndex() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected");

  const db = mongoose.connection.db;

  // Drop the stale index on rebirthids
  try {
    await db.collection("rebirthids").dropIndex("mainUserId_1_round_1_sequence_1");
    console.log("✅ Dropped stale index: mainUserId_1_round_1_sequence_1 on rebirthids");
  } catch (err) {
    if (err.code === 27 || /index not found/i.test(err.message)) {
      console.log("ℹ️  Index already gone (or never existed). Nothing to drop.");
    } else {
      console.error("❌ Error dropping index:", err.message);
    }
  }

  await mongoose.disconnect();
  process.exit(0);
}

dropIndex().catch((e) => { console.error(e); process.exit(1); });
