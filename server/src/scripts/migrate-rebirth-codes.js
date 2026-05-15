#!/usr/bin/env node

/**
 * Migration Script: Convert rebirths to new naming format
 *
 * This script migrates existing rebirths from old format to new format:
 * Old: BKS12345-R1, BKS12345-R1-X1, BKS12345-R1-A1, etc.
 * New: BKS12345-0.1, BKS12345-1.5, BKS12345-2.3, etc.
 *
 * Migration Strategy:
 * 1. Parse old rebirth code to extract member ID, generation level
 * 2. For each rebirth, determine levelNumber based on generation
 * 3. Get next sequence for that level
 * 4. Generate new displayCode and update record
 */

import mongoose from "mongoose";
import { RebirthId } from "../modules/autopool/rebirth.model.js";
import { AutoPoolLevelCounter } from "../modules/autopool/autopool-level-counter.model.js";
import { User } from "../modules/user/user.model.js";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://alokmishra9861_db_user:123BKS@bksdemo.f7rkvkp.mongodb.net/?appName=BKSDemo";

/**
 * Parse old rebirth code to extract components
 * Examples: BKS12345-R1, BKS12345-R1-X1, BKS12345-R1-A1
 */
function parseOldRebirthCode(code) {
  // Extract member ID and generation parts
  const parts = code.split("-");
  const memberId = parts[0]; // e.g., BKS12345

  // Determine level based on suffix
  // -R1, -R2: level 0 (initial rebirths)
  // -R1-X1, -R1-X2: level 1
  // -R1-X1-A1: level 2
  let levelNumber = 0;

  if (parts[1]?.startsWith("R")) {
    levelNumber = 0; // Initial: R1, R2
  } else if (parts[2]?.startsWith("X")) {
    levelNumber = 1; // First generation: -X1, -X2
  } else if (parts[3]?.startsWith("A")) {
    levelNumber = 2; // Second generation: -A1, -A2
  } else if (parts[2]?.startsWith("A")) {
    levelNumber = 2; // Could also be -R-A format (shouldn't happen but handle it)
  }

  return { memberId, levelNumber };
}

/**
 * Get next sequence for a user at a level
 */
async function getNextSequence(userId, memberId, levelNumber) {
  const counter = await AutoPoolLevelCounter.findOneAndUpdate(
    { ownerUserId: userId, levelNumber },
    {
      $inc: { currentSequence: 1 },
      $setOnInsert: {
        ownerUserId: userId,
        ownerMemberId: memberId,
        levelNumber,
        currentSequence: 1,
      },
    },
    { upsert: true, new: true },
  );
  return counter.currentSequence;
}

async function migrateRebirths() {
  try {
    console.log("[MIGRATION] Starting rebirth code migration...\n");
    await mongoose.connect(MONGODB_URI);

    const rebirths = await RebirthId.find();
    console.log(`[MIGRATION] Found ${rebirths.length} rebirths to migrate\n`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const rebirth of rebirths) {
      try {
        // Skip if already has new format
        if (rebirth.displayCode) {
          skipped++;
          continue;
        }

        // Get owner user to retrieve memberId
        const user = await User.findById(rebirth.ownerUserId);
        if (!user) {
          console.warn(
            `[SKIP] No user found for rebirth ${rebirth._id}, memberId unknown`,
          );
          errors++;
          continue;
        }

        const memberId = user.memberId;

        // Parse old code if it exists
        let levelNumber = 0;
        if (rebirth.rebirthCode) {
          const parsed = parseOldRebirthCode(rebirth.rebirthCode);
          levelNumber = parsed.levelNumber;
        }

        // Get next sequence for this level
        const levelSequence = await getNextSequence(
          rebirth.ownerUserId,
          memberId,
          levelNumber,
        );

        // Generate new display code
        const displayCode = `${memberId}-${levelNumber}.${levelSequence}`;

        // Update rebirth record
        await RebirthId.findByIdAndUpdate(rebirth._id, {
          $set: {
            displayCode,
            ownerMemberId: memberId,
            levelNumber,
            levelSequence,
          },
        });

        migrated++;
        console.log(
          `[OK] ${rebirth._id.toString().slice(0, 8)}... -> ${displayCode}`,
        );
      } catch (err) {
        errors++;
        console.error(
          `[ERROR] Failed to migrate ${rebirth._id}: ${err.message}`,
        );
      }
    }

    console.log(`\n[MIGRATION] Complete!`);
    console.log(`  - Migrated: ${migrated}`);
    console.log(`  - Skipped: ${skipped}`);
    console.log(`  - Errors: ${errors}`);

    // Verify
    const updated = await RebirthId.findOne({ displayCode: { $exists: true } });
    if (updated) {
      console.log(`\n[VERIFY] Sample migrated rebirth: ${updated.displayCode}`);
    }

    process.exit(errors > 0 ? 1 : 0);
  } catch (err) {
    console.error("[FATAL]", err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

migrateRebirths();
