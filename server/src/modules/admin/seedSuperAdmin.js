import { AdminModel } from "./admin.model.js";
import { USER_ROLES } from "../../common/enums/index.js";
import { hashPassword } from "../../common/helpers/password.helper.js";
import { logger } from "../../common/logger/logger.js";

const DEFAULT_SUPERADMIN_USERNAME = "superadmin";
const DEFAULT_SUPERADMIN_EMAIL = "superadmin@bkswealthclub.local";
const DEFAULT_SUPERADMIN_PASSWORD = "SuperAdmin@123";
const DEFAULT_SUPERADMIN_SPONSOR_ID = "BWC000000";

export async function seedSuperAdmin() {
  const username =
    process.env.SUPERADMIN_USERNAME?.trim() || DEFAULT_SUPERADMIN_USERNAME;
  const email =
    process.env.SUPERADMIN_EMAIL?.trim().toLowerCase() ||
    DEFAULT_SUPERADMIN_EMAIL;
  const password =
    process.env.SUPERADMIN_PASSWORD?.trim() || DEFAULT_SUPERADMIN_PASSWORD;
  const sponsorId =
    process.env.SUPERADMIN_SPONSOR_ID?.trim().toUpperCase() ||
    DEFAULT_SUPERADMIN_SPONSOR_ID;

  if (!/^BWC\d{6,}$/.test(sponsorId)) {
    throw new Error("SUPERADMIN_SPONSOR_ID must be in BWC123456 format");
  }

  const existingSuperAdmin = await AdminModel.findOne({
    role: USER_ROLES.SUPERADMIN,
  });

  if (existingSuperAdmin) {
    let changed = false;
    if (!existingSuperAdmin.sponsorId) {
      existingSuperAdmin.sponsorId = sponsorId;
      changed = true;
    }
    if (!existingSuperAdmin.isActive) {
      existingSuperAdmin.isActive = true;
      changed = true;
    }
    if (changed) {
      await existingSuperAdmin.save();
      logger.info("Existing superadmin updated with sponsor ID");
    }
    return;
  }

  const passwordHash = await hashPassword(password);

  await AdminModel.create({
    username,
    email,
    passwordHash,
    role: USER_ROLES.SUPERADMIN,
    sponsorId,
    isActive: true,
  });

  logger.info("Superadmin seeded successfully");
}
