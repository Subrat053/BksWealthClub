#!/usr/bin/env node

/**
 * Fix AutoPool nodes:
 * - Ensure every user has a MAIN node (create and enqueue if missing)
 * - Ensure every RebirthId has a REBIRTH node (create and enqueue if missing)
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../modules/user/user.model.js";
import { RebirthId } from "../modules/autopool/rebirth.model.js";
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

  const { default: autopool3x3Service } =
    await import("../modules/autopool/autopool-3x3.service.js");

  const users = await User.find({}).lean();
  console.log(`Found ${users.length} users; checking MAIN nodes...`);

  let mainCreated = 0;
  for (const user of users) {
    const mainNode = await AutoPoolNode.findOne({
      ownerUserId: user._id,
      nodeType: "MAIN",
    });
    if (!mainNode) {
      try {
        console.log(`Creating MAIN node for ${user.memberId}`);
        const node = await autopool3x3Service.createAutoPoolNodeForMainUser(
          user._id,
          null,
          user.memberId,
        );
        await autopool3x3Service.enqueueAutoPoolNode(node._id);
        mainCreated++;
      } catch (err) {
        console.error(
          `Failed to create MAIN node for ${user.memberId}:`,
          err.message,
        );
      }
    }
  }

  const rebirths = await RebirthId.find({}).lean();
  console.log(
    `Found ${rebirths.length} rebirth records; checking REBIRTH nodes...`,
  );

  let rebirthNodesCreated = 0;
  for (const rebirth of rebirths) {
    const exists = await AutoPoolNode.findOne({ rebirthId: rebirth._id });
    if (!exists) {
      try {
        console.log(
          `Creating REBIRTH node for rebirth ${rebirth._id} (${rebirth.displayCode || rebirth.rebirthCode})`,
        );
        const node = await autopool3x3Service.createAutoPoolNodeForRebirth(
          rebirth._id,
        );
        await autopool3x3Service.enqueueAutoPoolNode(node._id);
        rebirthNodesCreated++;
      } catch (err) {
        console.error(
          `Failed to create REBIRTH node for ${rebirth._id}:`,
          err.message,
        );
      }
    }
  }

  console.log(
    `Completed. MAIN nodes created: ${mainCreated}, REBIRTH nodes created: ${rebirthNodesCreated}`,
  );

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
