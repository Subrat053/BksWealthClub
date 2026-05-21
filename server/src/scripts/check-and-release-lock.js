import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { AutopoolRepairLock } from "../modules/autopool/autopool-repair-lock.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI missing in env");
    process.exit(1);
  }
  
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  const lock = await AutopoolRepairLock.findOne({ key: "autopool_chronological_replay_v1" });
  console.log("Current Lock Status:", lock);

  if (lock && lock.isLocked) {
    console.log("Stale lock detected. Releasing lock...");
    lock.isLocked = false;
    lock.releasedAt = new Date();
    await lock.save();
    console.log("Lock successfully released!");
  } else {
    console.log("Lock is not currently locked.");
  }

  await mongoose.disconnect();
  console.log("Disconnected.");
}

main().catch(console.error);
