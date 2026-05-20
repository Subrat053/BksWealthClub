/**
 * Repair script: Finds all COMPLETED rebirth nodes where rebirthGenerated=false
 * and triggers next-level rebirth generation for them.
 * Run this once to fix existing data after the race-condition bug was patched.
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

async function repairMissingRebirths() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected to MongoDB\n");

  const { default: autopool3x3Service } = await import(
    "../modules/autopool/autopool-3x3.service.js"
  );
  const { AutoPoolNode } = await import(
    "../modules/autopool/autopool-matrix.model.js"
  );

  // Find all COMPLETED REBIRTH nodes where rebirthGenerated is false (or missing)
  const brokenNodes = await AutoPoolNode.find({
    nodeType: "REBIRTH",
    status: "COMPLETED",
    $or: [
      { rebirthGenerated: false },
      { rebirthGenerated: { $exists: false } },
    ],
  }).lean();

  console.log(`🔍 Found ${brokenNodes.length} completed rebirth nodes missing next-level rebirths.\n`);

  if (brokenNodes.length === 0) {
    console.log("✅ Nothing to repair.");
    await mongoose.disconnect();
    process.exit(0);
  }

  let repaired = 0;
  let skipped = 0;

  for (const node of brokenNodes) {
    console.log(
      `\n  Repairing: ${node.nodeCode} [L${node.levelNumber}][S${node.levelSequence}]`
    );

    // Skip ROOT / non-rebirth
    if (node.nodeType !== "REBIRTH") {
      console.log(`    ⏭️  Skipped (not REBIRTH type)`);
      skipped++;
      continue;
    }

    // Skip level 9 (no more rebirths after level 9)
    if (node.levelNumber >= 9) {
      console.log(`    ⏭️  Skipped (Level 9 - no next level)`);
      // Mark as generated so we don't visit it again
      await AutoPoolNode.findByIdAndUpdate(node._id, {
        $set: { rebirthGenerated: true, rebirthGeneratedAt: new Date() },
      });
      skipped++;
      continue;
    }

    try {
      await autopool3x3Service.generateNextLevelRebirthsForCompletedRebirthNode(
        node.ownerUserId,
        node.levelNumber,
        node.levelSequence,
        null // No session — each call uses its own transaction
      );
      console.log(`    ✅ Repaired: generated next-level rebirths for ${node.nodeCode}`);
      repaired++;
    } catch (err) {
      console.error(`    ❌ Failed to repair ${node.nodeCode}:`, err.message);
    }
  }

  console.log("\n══════════════════════════════════════════════");
  console.log(`  Repair Complete: ${repaired} repaired, ${skipped} skipped`);
  console.log("══════════════════════════════════════════════");

  // Process the queue to place any newly created rebirth nodes
  if (repaired > 0) {
    console.log("\n⚙️  Processing AutoPool queue to place repaired rebirth nodes...");
    try {
      const result = await autopool3x3Service.processAutoPoolQueue();
      console.log(`✅ Queue processed. Placed ${result.placedCount} nodes.`);
    } catch (err) {
      console.warn("⚠️  Queue processing error (may retry automatically):", err.message);
    }
  }

  await mongoose.disconnect();
  process.exit(0);
}

repairMissingRebirths().catch((e) => {
  console.error("❌ Fatal error:", e);
  process.exit(1);
});
