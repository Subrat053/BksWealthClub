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

  // Show ALL nodes for BKS000000
  console.log("══════════════════════════════════════════════");
  console.log("  ALL AutoPool Nodes for BKS000000 (all levels)");
  console.log("══════════════════════════════════════════════");
  const nodes = await AutoPoolNode.find({ ownerMemberId: "BKS000000" })
    .lean()
    .sort({ levelNumber: 1, levelSequence: 1 });

  if (nodes.length === 0) {
    console.log("  No nodes found for BKS000000");
  } else {
    for (const n of nodes) {
      console.log(
        `  [L${n.levelNumber ?? "?"}][S${n.levelSequence ?? "?"}] ${n.nodeCode} | status=${n.status} | children=${n.directChildrenCount ?? 0}/3 | completedAt=${n.completedAt || "—"}`
      );
    }
  }

  console.log("\n══════════════════════════════════════════════");
  console.log("  ALL RebirthId documents for BKS000000");
  console.log("══════════════════════════════════════════════");
  const RebirthId = mongoose.model(
    "RebirthId",
    new mongoose.Schema({}, { strict: false }),
    "rebirthids"
  );
  const rebirths = await RebirthId.find({ ownerMemberId: "BKS000000" })
    .lean()
    .sort({ levelNumber: 1, levelSequence: 1 });

  if (rebirths.length === 0) {
    console.log("  No rebirths found for BKS000000");
  } else {
    for (const r of rebirths) {
      console.log(
        `  [L${r.levelNumber ?? "?"}][S${r.levelSequence ?? "?"}] ${r.displayCode || r.rebirthCode} | status=${r.status}`
      );
    }
  }

  console.log("\n══════════════════════════════════════════════");
  console.log("  AutoPoolLevelCompletion records for BKS000000");
  console.log("══════════════════════════════════════════════");
  const AutoPoolLevelCompletion = mongoose.model(
    "AutoPoolLevelCompletion",
    new mongoose.Schema({}, { strict: false }),
    "autopoollevelcompletions"
  );
  const User = mongoose.model(
    "User",
    new mongoose.Schema({}, { strict: false }),
    "users"
  );
  const adminUser = await User.findOne({ memberId: "BKS000000" }).lean();
  const completions = await AutoPoolLevelCompletion.find({
    ownerUserId: adminUser?._id,
  }).lean();

  if (completions.length === 0) {
    console.log("  No level completion records found for BKS000000");
  } else {
    for (const c of completions) {
      console.log(
        `  Level ${c.levelNumber}: isCompleted=${c.isCompleted} | completed=${c.completedNodeCount}/${c.expectedNodeCount} | completedAt=${c.completedAt || "—"}`
      );
    }
  }

  await mongoose.disconnect();
  console.log("\n✅ Done.");
  process.exit(0);
}

check().catch((e) => {
  console.error(e);
  process.exit(1);
});
