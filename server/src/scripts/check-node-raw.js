import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

const AutoPoolNode = mongoose.model(
  "AutoPoolNode",
  new mongoose.Schema({}, { strict: false }),
  "autopoolnodes"
);

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected\n");

  // Show BKS000000-0.2 raw document to check levelNumber and levelSequence
  const node = await AutoPoolNode.findOne({ nodeCode: "BKS000000-0.2" }).lean();
  if (!node) {
    console.log("BKS000000-0.2 NOT FOUND");
  } else {
    console.log("BKS000000-0.2 raw document:");
    console.log(JSON.stringify(node, null, 2));
  }

  await mongoose.disconnect();
  process.exit(0);
}

check().catch((e) => { console.error(e); process.exit(1); });
