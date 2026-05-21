import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected to MongoDB");

  const AutoPoolNode = mongoose.model(
    "AutoPoolNode",
    new mongoose.Schema({}, { strict: false }),
    "autopoolnodes"
  );

  const RebirthId = mongoose.model(
    "RebirthId",
    new mongoose.Schema({}, { strict: false }),
    "rebirthids"
  );

  const nodes = await AutoPoolNode.find({}).lean();
  console.log(`\n--- ALL AUTOPOOL NODES (${nodes.length}) ---`);
  console.log(JSON.stringify(nodes, null, 2));

  const rebirths = await RebirthId.find({}).lean();
  console.log(`\n--- ALL REBIRTHS (${rebirths.length}) ---`);
  console.log(JSON.stringify(rebirths, null, 2));

  await mongoose.disconnect();
  console.log("\n✅ Done");
}

check().catch(console.error);
