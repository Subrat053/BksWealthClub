import { User } from "../user/user.model.js";
import { hashPassword } from "../../common/helpers/password.helper.js";
import { logger } from "../../common/logger/logger.js";

const DEFAULT_OPERATIONAL_ADMIN_MEMBER_ID = "BKS000000";
const DEFAULT_OPERATIONAL_ADMIN_EMAIL = "operational@bkswealthclub.local";
const DEFAULT_OPERATIONAL_ADMIN_PASSWORD = "OperationalAdmin@123";

export async function seedOperationalAdmin() {
  const memberId =
    process.env.OPERATIONAL_ADMIN_MEMBER_ID?.trim().toUpperCase() ||
    DEFAULT_OPERATIONAL_ADMIN_MEMBER_ID;
  const email =
    process.env.OPERATIONAL_ADMIN_EMAIL?.trim().toLowerCase() ||
    DEFAULT_OPERATIONAL_ADMIN_EMAIL;
  const password =
    process.env.OPERATIONAL_ADMIN_PASSWORD?.trim() ||
    DEFAULT_OPERATIONAL_ADMIN_PASSWORD;

  const existingAdmin = await User.findOne({ memberId });

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

    adminUser = await User.create({
      memberId,
      sponsorId: "SYSTEM", // No sponsor for root
      sponsorUserId: null,
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
    logger.info("Operational Admin seeded successfully");
  } else {
    adminUser = existingAdmin;
  }

  try {
    const { referralService } = await import(
      "../referral/referral.service.js",
    );
    await referralService.createReferralTreeNode({
      userId: adminUser._id,
      sponsorUserId: null,
    });
  } catch (err) {
    logger.error("Failed to seed referral tree for Operational Admin:", err);
  }

  // Seed Autopool + rebirth nodes for Operational Admin if missing
  try {
    const { RebirthId } = await import("../autopool/rebirth.model.js");
    const { autopoolService } = await import(
      "../autopool/autopool.service.js",
    );

    const existingRoot = await RebirthId.findOne({
      ownerUserId: adminUser._id,
      rebirthCode: adminUser.memberId,
    });

    if (!existingRoot) {
      await autopoolService.activateMemberInAutopool({
        userId: adminUser._id,
        memberId: adminUser.memberId,
      });
      logger.info("Operational Admin rebirth nodes created successfully");
    }
  } catch (err) {
    logger.error("Failed to seed autopool for Operational Admin:", err);
  }
}
