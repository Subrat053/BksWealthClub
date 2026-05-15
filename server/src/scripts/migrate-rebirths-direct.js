#!/usr/bin/env node

/**
 * Direct Migration: Update rebirths with new display codes
 */

import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://alokmishra9861_db_user:123BKS@bksdemo.f7rkvkp.mongodb.net/?appName=BKSDemo";

async function main() {
  try {
    console.log("[MIGRATE] Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);

    const db = mongoose.connection.db;

    // Get all rebirths
    const rebirths = await db.collection("rebirth_ids").find({}).toArray();
    console.log(`[MIGRATE] Found ${rebirths.length} rebirth records\n`);

    if (rebirths.length === 0) {
      console.log("[INFO] No rebirths to migrate");
      process.exit(0);
    }

    // Get user collection for member IDs
    const userIds = [...new Set(rebirths.map((r) => r.ownerUserId))];
    const users = await db
      .collection("users")
      .find({ _id: { $in: userIds } })
      .toArray();

    const userMap = new Map(
      users.map((u) => [u._id.toString(), { memberId: u.memberId }]),
    );

    let updated = 0;

    for (const rebirth of rebirths) {
      const user = userMap.get(rebirth.ownerUserId.toString());
      if (!user) {
        console.warn(
          `[SKIP] No user found for rebirth ${rebirth._id}, skipping`,
        );
        continue;
      }

      const memberId = user.memberId;

      // Determine level based on old rebirthCode format
      let levelNumber = 0;
      if (rebirth.rebirthCode) {
        if (rebirth.rebirthCode.includes("-X")) {
          levelNumber = 1;
        } else if (rebirth.rebirthCode.includes("-A")) {
          levelNumber = 2;
        }
        // else default 0 (initial)
      }

      // For now, just set levelNumber and ownerMemberId
      // We'll set displayCode as memberId-levelNumber.sequenceNumber
      const displayCode = `${memberId}-${levelNumber}.${rebirth.sequenceNumber || 1}`;

      // Update the record
      await db.collection("rebirth_ids").updateOne(
        { _id: rebirth._id },
        {
          $set: {
            displayCode,
            ownerMemberId: memberId,
            levelNumber,
            levelSequence: rebirth.sequenceNumber || 1,
          },
        },
      );

      updated++;
      console.log(
        `[OK] ${rebirth._id.toString().slice(0, 8)}... -> ${displayCode}`,
      );
    }

    console.log(`\n[MIGRATE] Successfully updated ${updated} rebirths`);

    // Verify
    const sample = await db
      .collection("rebirth_ids")
      .findOne({ displayCode: { $exists: true } });
    if (sample) {
      console.log(`[VERIFY] Sample: displayCode=${sample.displayCode}`);
    }

    process.exit(0);
  } catch (err) {
    console.error("[ERROR]", err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

main();
