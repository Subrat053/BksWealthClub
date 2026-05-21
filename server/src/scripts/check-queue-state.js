import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;

const nodes = await db.collection("autopoolnodes")
  .find({ isActiveInAutopool: true })
  .sort({ queueSerialNo: 1 })
  .toArray();

console.log("\n=== AutoPool Queue State (sorted by queueSerialNo) ===");
nodes.forEach(n => {
  const parent = n.matrixParentId ? "(has parent)" : "(no parent = ROOT)";
  console.log(`  ${n.nodeCode.padEnd(20)} | type=${n.nodeType.padEnd(6)} | status=${n.status.padEnd(9)} | children=${n.directChildrenCount}/3 | qSerial=${n.queueSerialNo} | pSerial=${n.placementSerialNo || "-"} | ${parent}`);
});
console.log("");

await mongoose.disconnect();
process.exit(0);
