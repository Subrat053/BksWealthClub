#!/usr/bin/env node

/**
 * Rebuild AutoPool Tree from scratch:
 * 1. Deletes all AutoPoolNode documents and clears autopool queue collection
 * 2. Optionally resets AutoPoolLevelCounter counters
 * 3. Activates every user in the 3x3 system (creates MAIN + initial rebirths + rebirth nodes)
 * 4. Processes the AutoPool queue to place nodes
 * 5. Rebuilds ReferralTree
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { AutoPoolNode } from "../modules/autopool/autopool-matrix.model.js";
import { AutoPoolLevelCounter } from "../modules/autopool/autopool-level-counter.model.js";
import { User } from "../modules/user/user.model.js";

dotenv.config({ path: "./.env" });

const MONGODB_URI = process.env.MONGODB_URI;
const RESET_COUNTERS = true; // set false to keep existing counters

async function run() {
  if (!MONGODB_URI) {
    console.error("MONGODB_URI not configured");
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 30000 });
  const db = mongoose.connection.db;

  console.log("Connected to MongoDB");

  // 1. Delete AutoPool nodes
  const beforeNodes = await AutoPoolNode.countDocuments();
  console.log(`AutoPool nodes before: ${beforeNodes}`);
  await AutoPoolNode.deleteMany({});
  console.log("Deleted all AutoPoolNode documents");

  // 2. Clear autopool queue collection if present
  const collections = await db.listCollections().toArray();
  const queueColl =
    collections.find((c) => c.name.toLowerCase().includes("autopoolqueue"))
      ?.name || "autopoolqueues";
  try {
    const res = await db.collection(queueColl).deleteMany({});
    console.log(`Cleared collection ${queueColl} (${res.deletedCount} docs)`);
  } catch (err) {
    console.warn(
      `Queue collection ${queueColl} not found or could not be cleared: ${err.message}`,
    );
  }

  // 3. Optionally reset counters
  if (RESET_COUNTERS) {
    const countersBefore = await AutoPoolLevelCounter.countDocuments();
    console.log(`AutoPoolLevelCounter before: ${countersBefore}`);
    await AutoPoolLevelCounter.deleteMany({});
    console.log("Cleared AutoPoolLevelCounter collection");
  }

  // 4. Activate every user
  const users = await User.find({}).sort({ createdAt: 1 }).lean();
  console.log(`Found ${users.length} users; activating in AutoPool...`);

  const { default: autopoolService } =
    await import("../modules/autopool/autopool-3x3.service.js");

  let activated = 0;
  for (const user of users) {
    try {
      // activateUserIn3x3AutoPool handles duplicates gracefully
      await autopoolService.activateUserIn3x3AutoPool(user._id, user.memberId);
      activated++;
      if (activated % 50 === 0)
        console.log(`Activated ${activated} users so far...`);
    } catch (err) {
      console.error(`Failed to activate ${user.memberId}: ${err.message}`);
    }
  }

  console.log(
    `Activation complete. Activated ${activated}/${users.length} users.`,
  );

  // 5. Process queue
  console.log("Processing AutoPool queue (placing nodes)...");
  const result = await autopoolService.processAutoPoolQueue();
  console.log("Queue process result:", result);

  // 6. Rebuild Referral Tree by calling existing script
  console.log("Rebuilding Referral Tree...");
  try {
    // Execute the other script as a child process to reuse its logic
    const { execSync } = await import("child_process");
    execSync("node src/scripts/rebuild-referral-tree.js", { stdio: "inherit" });
  } catch (err) {
    console.error("Failed to rebuild referral tree via script:", err.message);
  }

  await mongoose.disconnect();
  console.log("Rebuild finished.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
