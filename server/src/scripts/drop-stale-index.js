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
      console.log("ℹ️  Index mainUserId_1_round_1_sequence_1 already gone on rebirthids.");
    } else {
      console.error("❌ Error dropping index on rebirthids:", err.message);
    }
  }

  // Drop the stale index on autopoolqueues
  try {
    await db.collection("autopoolqueues").dropIndex("rebirthNodeId_1");
    console.log("✅ Dropped stale index: rebirthNodeId_1 on autopoolqueues");
  } catch (err) {
    if (err.code === 27 || /index not found/i.test(err.message)) {
      console.log("ℹ️  Index rebirthNodeId_1 already gone on autopoolqueues.");
    } else {
      console.error("❌ Error dropping index on autopoolqueues:", err.message);
    }
  }

  try {
    await db.collection("autopoolqueues").dropIndex("queueSerialNo_1");
    console.log("✅ Dropped stale index: queueSerialNo_1 on autopoolqueues");
  } catch (err) {
    if (err.code === 27 || /index not found/i.test(err.message)) {
      console.log("ℹ️  Index queueSerialNo_1 already gone on autopoolqueues.");
    } else {
      console.error("❌ Error dropping index queueSerialNo_1 on autopoolqueues:", err.message);
    }
  }

  await mongoose.disconnect();
  process.exit(0);
}

dropIndex().catch((e) => { console.error(e); process.exit(1); });
