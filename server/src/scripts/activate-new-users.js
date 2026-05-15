#!/usr/bin/env node

/**
 * Activate users in AutoPool who don't yet have AutoPool nodes.
 *
 * For each user without an AutoPoolNode, call activateUserIn3x3AutoPool
 * which creates initial rebirths, main node, rebirth nodes and enqueues them.
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../modules/user/user.model.js";
import { AutoPoolNode } from "../modules/autopool/autopool-matrix.model.js";

dotenv.config({ path: "./.env" });

const MONGODB_URI = process.env.MONGODB_URI;

async function main() {
  if (!MONGODB_URI) {
    console.error("MONGODB_URI not configured");
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  // Find users that have no AutoPool nodes
  const users = await User.find({}).lean();
  console.log(
    `Found ${users.length} users, scanning for missing AutoPool nodes...`,
  );

  const { default: autopool3x3Service } =
    await import("../modules/autopool/autopool-3x3.service.js");

  let activated = 0;
  for (const user of users) {
    // Skip operational admin if already root
    if (!user || !user._id) continue;

    const nodeCount = await AutoPoolNode.countDocuments({
      ownerUserId: user._id,
    });
    if (nodeCount > 0) continue;

    try {
      console.log(
        `Activating user ${user.memberId} (${user._id}) in AutoPool...`,
      );
      await autopool3x3Service.activateUserIn3x3AutoPool(
        user._id,
        user.memberId,
      );
      activated++;
    } catch (err) {
      console.error(`Failed to activate ${user.memberId}:`, err.message);
    }
  }

  console.log(`Activation complete. Activated ${activated} users.`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
