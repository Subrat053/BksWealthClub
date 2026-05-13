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

  // Seed Autopool + rebirth nodes for Operational Admin in the new 3x3 system
  try {
    const { default: autopool3x3Service } = await import(
      "../autopool/autopool-3x3.service.js"
    );

    // This will create the ROOT node if it doesn't exist
    await autopool3x3Service.processAutoPoolQueue();
    
    // --- MATRIX REPAIR LOGIC ---
    // Ensure the admin is the ONLY root node. If others were placed as roots previously,
    // we reset them to PENDING so they can be placed under the Admin correctly.
    const { AutoPoolNode } = await import("../autopool/autopool-matrix.model.js");
    
    // 1. Force Admin to be root if it somehow got a parent or wrong type
    const adminNode = await AutoPoolNode.findOne({ nodeCode: memberId });
    if (adminNode) {
      let repairNeeded = false;
      
      if (adminNode.matrixParentId !== null || adminNode.parentNodeId !== null) {
        logger.info(`[Repair] Admin ${memberId} has a parent. Fixing root status...`);
        
        // Remove from current parent to maintain count integrity
        const parentId = adminNode.matrixParentId || adminNode.parentNodeId;
        await AutoPoolNode.updateOne(
          { _id: parentId },
          { $pull: { directChildren: adminNode._id }, $inc: { directChildrenCount: -1 } }
        );
        
        adminNode.matrixParentId = null;
        adminNode.parentNodeId = null;
        repairNeeded = true;
      }
      
      if (adminNode.nodeType !== "ROOT") {
        adminNode.nodeType = "ROOT";
        adminNode.isRoot = true;
        adminNode.isOperationalRoot = true;
        repairNeeded = true;
      }
      
      if (adminNode.status !== "PLACED") {
        adminNode.status = "PLACED";
        repairNeeded = true;
      }

      if (repairNeeded) {
        await adminNode.save();
      }
    }
    
    // 2. Reset any accidental roots (nodes with no parent that are NOT the admin)
    const accidentalRoots = await AutoPoolNode.find({ 
      matrixParentId: null, 
      parentNodeId: null,
      nodeCode: { $ne: memberId },
      status: { $in: ["PLACED", "COMPLETED"] },
      nodeType: { $ne: "ROOT" }
    });
    
    if (accidentalRoots.length > 0) {
      logger.info(`[Repair] Resetting ${accidentalRoots.length} accidental root nodes to PENDING...`);
      for (const rootNode of accidentalRoots) {
        rootNode.status = "PENDING";
        rootNode.matrixParentId = null;
        rootNode.parentNodeId = null;
        await rootNode.save();
      }
    }
    
    // 3. Immediate placement to ensure everything is re-linked under the Admin root
    await autopool3x3Service.processAutoPoolQueue();
    
    logger.info("Operational Admin 3x3 AutoPool nodes verified and matrix structure repaired");
  } catch (err) {
    logger.warn("Failed to seed/repair 3x3 AutoPool for Operational Admin:", err.message);
  }
}
