import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

async function debug() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected to MongoDB");

  const AutoPoolNode = mongoose.model(
    "AutoPoolNode",
    new mongoose.Schema({}, { strict: false }),
    "autopoolnodes"
  );

  const root1 = await AutoPoolNode.findOne({ nodeCode: "BKS000000-0.1" }).lean();
  console.log("=== BKS000000-0.1 ===");
  console.log(JSON.stringify(root1, null, 2));

  const root2 = await AutoPoolNode.findOne({ nodeCode: "BKS000000-0.2" }).lean();
  console.log("=== BKS000000-0.2 ===");
  console.log(JSON.stringify(root2, null, 2));

  // Let's also see the first few nodes in the visual tree list
  const firstNodes = await AutoPoolNode.find({ isActiveInAutopool: true })
    .sort({ queueSerialNo: 1 })
    .limit(5)
    .lean();
  console.log("=== First 5 nodes by queueSerialNo ===");
  firstNodes.forEach(n => {
    console.log(`Node: ${n.nodeCode}, ParentNodeId: ${n.parentNodeId}, MatrixParentId: ${n.matrixParentId}, isRoot: ${n.isRoot}, status: ${n.status}`);
  });

  await mongoose.disconnect();
  console.log("✅ Done");
}

debug().catch(console.error);
