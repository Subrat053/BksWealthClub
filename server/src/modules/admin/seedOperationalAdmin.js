import { User } from "../user/user.model.js";
import { AutoPoolNode } from "../autopool/autopool-matrix.model.js";
import { RebirthId } from "../autopool/rebirth.model.js";
import { env } from "../../config/env.js";
import { hashPassword } from "../../common/helpers/password.helper.js";
import { logger } from "../../common/logger/logger.js";

const DEFAULT_OPERATIONAL_ADMIN_MEMBER_ID = "BKS000000";
const DEFAULT_OPERATIONAL_ADMIN_EMAIL = "operational@bkswealthclub.local";
const DEFAULT_OPERATIONAL_ADMIN_PASSWORD = "OperationalAdmin@123";
const LEGACY_OPERATIONAL_ADMIN_MEMBER_IDS = ["BKS000000"];

const replaceMemberIdPrefix = (value, fromMemberId, toMemberId) => {
  if (typeof value !== "string") {
    return value;
  }

  return value.startsWith(fromMemberId)
    ? `${toMemberId}${value.slice(fromMemberId.length)}`
    : value;
};

async function migrateOperationalAdminIdentity(
  adminUser,
  fromMemberId,
  toMemberId,
) {
  if (fromMemberId === toMemberId) {
    return adminUser;
  }

  const referralLinkBase = process.env.BASE_URL || "http://localhost:3000";

  adminUser.memberId = toMemberId;
  adminUser.sponsorId = toMemberId;
  adminUser.referralCode = toMemberId;
  adminUser.referralLink = `${referralLinkBase}/register?ref=${toMemberId}`;
  await adminUser.save();

  const rootPrefixMatcher = new RegExp(
    `^${fromMemberId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
  );

  const [legacyNodes, legacyRebirths] = await Promise.all([
    AutoPoolNode.find({ nodeCode: rootPrefixMatcher }),
    RebirthId.find({ rebirthCode: rootPrefixMatcher }),
  ]);

  for (const node of legacyNodes) {
    node.nodeCode = replaceMemberIdPrefix(
      node.nodeCode,
      fromMemberId,
      toMemberId,
    );
    node.nodeId = replaceMemberIdPrefix(node.nodeId, fromMemberId, toMemberId);
    node.rebirthCode = replaceMemberIdPrefix(
      node.rebirthCode,
      fromMemberId,
      toMemberId,
    );
    await node.save();
  }

  for (const rebirth of legacyRebirths) {
    rebirth.rebirthCode = replaceMemberIdPrefix(
      rebirth.rebirthCode,
      fromMemberId,
      toMemberId,
    );
    await rebirth.save();
  }

  return adminUser;
}

export async function seedOperationalAdmin() {
  const memberId =
    process.env.OPERATIONAL_ADMIN_MEMBER_ID?.trim().toUpperCase() ||
    env.OPERATIONAL_ADMIN_MEMBER_ID ||
    DEFAULT_OPERATIONAL_ADMIN_MEMBER_ID;
  const email =
    process.env.OPERATIONAL_ADMIN_EMAIL?.trim().toLowerCase() ||
    DEFAULT_OPERATIONAL_ADMIN_EMAIL;
  const password =
    process.env.OPERATIONAL_ADMIN_PASSWORD?.trim() ||
    DEFAULT_OPERATIONAL_ADMIN_PASSWORD;

  let existingAdmin = await User.findOne({ memberId });

  if (!existingAdmin) {
    for (const legacyMemberId of LEGACY_OPERATIONAL_ADMIN_MEMBER_IDS) {
      existingAdmin = await User.findOne({ memberId: legacyMemberId });
      if (existingAdmin) {
        existingAdmin = await migrateOperationalAdminIdentity(
          existingAdmin,
          legacyMemberId,
          memberId,
        );
        logger.info("Migrated legacy operational admin member ID", {
          from: legacyMemberId,
          to: memberId,
        });
        break;
      }
    }
  }

  if (existingAdmin) {
    let changed = false;

    if (!existingAdmin.isOperationalAdmin) {
      existingAdmin.isOperationalAdmin = true;
      existingAdmin.isSystemRoot = true;
      changed = true;
    }

    if (existingAdmin.status !== "active") {
      existingAdmin.status = "active";
      existingAdmin.isActivated = true;
      existingAdmin.isActive = true;
      existingAdmin.activationStatus = "ACTIVE";
      changed = true;
    }

    if (changed) {
      await existingAdmin.save();
      logger.info("Existing operational admin updated", {
        memberId: existingAdmin.memberId,
      });
    }
  }

  let adminUser;
  if (!existingAdmin) {
    const passwordHash = await hashPassword(password);

    // Admin is self-sponsored (root of the tree)
    adminUser = await User.create({
      memberId,
      sponsorId: memberId, // Self-sponsor - root user
      sponsorUserId: null, // No parent user
      referredByUserId: null,
      fullName: "Operational Admin",
      email,
      passwordHash,
      plainPassword: password, // Store plain password for admin visibility if needed
      referralCode: memberId,
      referralLink: `${process.env.BASE_URL || "http://localhost:3000"}/register?ref=${memberId}`,
      registrationSource: "admin",
      status: "active",
      isEmailVerified: true,
      isActivated: true,
      activationStatus: "ACTIVE",
      isOperationalAdmin: true,
      isSystemRoot: true,
    });
    logger.info("Operational Admin seeded successfully", { memberId });
  } else {
    adminUser = existingAdmin;
  }

  try {
    const { referralService } = await import("../referral/referral.service.js");
    await referralService.createReferralTreeNode({
      userId: adminUser._id,
      sponsorUserId: null,
    });
  } catch (err) {
    logger.error("Failed to seed referral tree for Operational Admin:", err);
  }

  // Seed Autopool + rebirth nodes for Operational Admin in the new 3x3 system
  try {
    const { default: autopool3x3Service } =
      await import("../autopool/autopool-3x3.service.js");

    // This will create the ROOT node if it doesn't exist
    await autopool3x3Service.processAutoPoolQueue();

    // --- MATRIX REPAIR LOGIC ---
    // Ensure the admin is the ONLY root node. If others were placed as roots previously,
    // we reset them to PENDING so they can be placed under the Admin correctly.
    const { AutoPoolNode } = await import("../autopool/autopool-matrix.model.js");
    
    // 1. Force Admin to be root if it somehow got a parent or wrong type
    // 1. Force Admin to be root anchor (NOT enqueued)
    const adminNode = await AutoPoolNode.findOne({ nodeCode: memberId });
    if (adminNode) {
      if (adminNode.status !== "PLACED" || adminNode.nodeType !== "ROOT") {
        logger.info(`[Repair] Fixing Admin Root ${memberId}...`);
        adminNode.status = "PLACED";
        adminNode.nodeType = "ROOT";
        adminNode.isRoot = true;
        adminNode.matrixParentId = null;
        adminNode.parentNodeId = null;
        await adminNode.save();
      }
    }
    
    // 2. Ensure initial rebirths exist in BOTH systems
    const { RebirthModel } = await import("../income/rebirth.model.js");
    const { generateInitialRebirthCodes } = await import("../autopool/autopool-3x3.service.js");
    const [rb1Code, rb2Code] = generateInitialRebirthCodes(memberId);

    // Ensure Rebirth entries exist for User List visibility
    const rebirthData = [
      { code: rb1Code, seq: 1 },
      { code: rb2Code, seq: 2 }
    ];

    for (const rb of rebirthData) {
      const existing = await RebirthModel.findOne({ rebirthCode: rb.code });
      if (!existing) {
        await RebirthModel.create({
          userId: adminUser._id,
          rebirthCode: rb.code,
          sequenceNo: rb.seq,
          walletBalance: 0,
          sourceDepositId: null // Admin has no deposit
        });
        logger.info(`[Seed] Created admin rebirth ${rb.code} in rebirths collection`);
      }
    }

    // 3. Ensure AutoPool nodes exist and are enqueued
    // Calling activateUserIn3x3AutoPool handles node creation and enqueuing safely
    await autopool3x3Service.activateUserIn3x3AutoPool(adminUser._id, memberId);
    
    // 4. Process queue to place nodes
    await autopool3x3Service.processAutoPoolQueue();

    logger.info("Operational Admin 3x3 AutoPool nodes and rebirths verified.");
  } catch (err) {
    logger.warn(
      "Failed to seed/repair 3x3 AutoPool for Operational Admin:",
      err.message,
    );
  }
}
