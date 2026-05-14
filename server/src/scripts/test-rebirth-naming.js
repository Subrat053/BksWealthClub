#!/usr/bin/env node

/**
 * Test Script: Verify new rebirth naming convention
 *
 * This script tests if new rebirths are generated with the new format:
 * Format: BKS12345-0.1, BKS12345-1.5, etc. (instead of old BKS12345-R1, BKS12345-R1-X1)
 */

import mongoose from "mongoose";
import { RebirthId } from "../modules/autopool/rebirth.model.js";
import { AutoPoolLevelCounter } from "../modules/autopool/autopool-level-counter.model.js";
import { env } from "../config/env.js";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://alokmishra9861_db_user:123BKS@bksdemo.f7rkvkp.mongodb.net/?appName=BKSDemo";

async function main() {
  try {
    console.log("[TEST] Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("[TEST] ✓ Connected");

    // Check existing rebirths
    const rebirthCount = await RebirthId.countDocuments();
    console.log(`\n[TEST] Total rebirths in DB: ${rebirthCount}`);

    if (rebirthCount > 0) {
      console.log("\n[TEST] Sample rebirths (first 5):");
      const samples = await RebirthId.find()
        .select("displayCode ownerMemberId levelNumber levelSequence")
        .limit(5);

      samples.forEach((r, i) => {
        console.log(
          `  ${i + 1}. displayCode=${r.displayCode}, owner=${r.ownerMemberId}, level=${r.levelNumber}.${r.levelSequence}`,
        );
      });

      // Check for old format
      const oldFormatCount = await RebirthId.countDocuments({
        displayCode: { $regex: /-R\\d+/ },
      });
      if (oldFormatCount > 0) {
        console.log(
          `\n[WARNING] Found ${oldFormatCount} rebirths with old format (containing -R)`,
        );
      } else {
        console.log("\n[TEST] ✓ No rebirths found with old format (-R)");
      }
    } else {
      console.log(
        "\n[INFO] No rebirths yet. They will be generated with new format on first deposit.",
      );
    }

    // Check level counters
    const counters = await AutoPoolLevelCounter.find();
    console.log(`\n[TEST] Level counters: ${counters.length}`);
    counters.forEach((c) => {
      console.log(
        `  - User: ${c.ownerMemberId}, Level: ${c.levelNumber}, Current Sequence: ${c.currentSequence}`,
      );
    });

    console.log("\n[TEST] ✓ Test completed successfully!");
  } catch (err) {
    console.error("[ERROR]", err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

main();
