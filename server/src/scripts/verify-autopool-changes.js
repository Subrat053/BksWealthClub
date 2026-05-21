import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { User } from "../modules/user/user.model.js";
import autopool3x3Service from "../modules/autopool/autopool-3x3.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

async function verify() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected to MongoDB");

  const admin = await User.findOne({ memberId: "BKS000000" });
  if (!admin) {
    console.error("❌ Admin user BKS000000 not found!");
    await mongoose.disconnect();
    return;
  }
  console.log(`\nFound Admin User: ${admin.fullName} (${admin.memberId}), ID: ${admin._id}`);

  // 1. Check getIndividualAutopoolSummary for admin
  console.log("\n--- Testing getIndividualAutopoolSummary ---");
  const summaryResult = await autopool3x3Service.getIndividualAutopoolSummary({
    search: "BKS000000",
  });
  const adminSummary = summaryResult.users.find(u => u.memberId === "BKS000000");
  if (adminSummary) {
    console.log("Admin Summary Details:");
    console.log(`- memberId: ${adminSummary.memberId}`);
    console.log(`- totalRebirths (Expected: 30): ${adminSummary.totalRebirths}`);
    console.log(`- completedRebirthsCount (Expected: 14): ${adminSummary.completedRebirthsCount}`);
    console.log(`- pendingRebirthsCount (Expected: 16): ${adminSummary.pendingRebirthsCount}`);
  } else {
    console.log("❌ Admin not found in summary search!");
  }

  // 2. Check getIndividualAutopoolDetails for admin
  console.log("\n--- Testing getIndividualAutopoolDetails ---");
  const details = await autopool3x3Service.getIndividualAutopoolDetails(admin._id);
  const userSummary = details.userSummary;
  console.log("Admin Detailed Summary:");
  console.log(`- totalRebirthsCreated (Expected: 30): ${userSummary.totalRebirthsCreated}`);
  console.log(`- totalCompletedRebirths (Expected: 14): ${userSummary.totalCompletedRebirths}`);
  console.log(`- totalPendingRebirths (Expected: 16): ${userSummary.totalPendingRebirths}`);

  console.log("\n--- Checking Level 0 Rebirths in Details ---");
  const level0 = details.levelWiseStatus.find(l => l.level === 0);
  if (level0) {
    console.log(`Level 0 Required Count: ${level0.requiredCount}`);
    console.log(`Level 0 Generated Count (Expected: 2): ${level0.generatedCount}`);
    console.log(`Level 0 Completed Count (Expected: 2): ${level0.completedCount}`);
    console.log("Nodes under Level 0:");
    level0.rebirths.forEach(node => {
      console.log(`  - Rebirth Code: ${node.rebirthCode}, Status: ${node.status}, Children: ${node.childrenCount}/3`);
    });

    const hasMainNode = level0.rebirths.some(node => node.rebirthCode === "BKS000000");
    const hasRootNode = level0.rebirths.some(node => node.rebirthCode === "BKS000000-0.1");
    console.log(`\nCheck results:`);
    console.log(`- Has 'BKS000000' (Expected: false): ${hasMainNode}`);
    console.log(`- Has 'BKS000000-0.1' (Expected: true): ${hasRootNode}`);
  } else {
    console.log("❌ Level 0 details not found!");
  }

  await mongoose.disconnect();
  console.log("\n✅ Verification complete");
}

verify().catch(console.error);
