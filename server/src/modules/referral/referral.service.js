import { ApiError } from "../../core/ApiError.js";
import { referralRepository } from "./referral.repository.js";
import { AdminModel } from "../admin/admin.model.js";
import { USER_ROLES } from "../../common/enums/index.js";
import { seedSuperAdmin } from "../admin/seedSuperAdmin.js";

export const referralService = {
  findSponsorById: async (sponsorId) =>
    referralRepository.findSponsorById(sponsorId),

  createReferralRelation: async (payload) =>
    referralRepository.createRelation(payload),

  getDirectReferralStats: async (sponsorUserRef) => {
    const directs =
      await referralRepository.getDirectsBySponsor(sponsorUserRef);
    return {
      totalDirects: directs.length,
      members: directs,
    };
  },

  validateSponsor: async (sponsorId) => {
    const normalizedSponsorId = sponsorId.trim().toUpperCase();
    const sponsorIdPattern = /^(BKS|BWC)\d{5,}$/i;
    const referralCodePattern = /^[A-Z]{1,4}\d{6}$/i;

    if (
      !sponsorIdPattern.test(normalizedSponsorId) &&
      !referralCodePattern.test(normalizedSponsorId)
    ) {
      throw new ApiError(
        400,
        "Sponsor ID or referral code must look like BKS12345 or ABCD123456",
      );
    }

    const sponsor =
      await referralRepository.findSponsorByIdentifier(normalizedSponsorId);

    if (sponsor) {
      return {
        sponsorId: sponsor.memberId,
        sponsorName: sponsor.fullName,
        sponsorStatus: sponsor.status,
        active: sponsor.status === "active",
        sponsorType: "user",
      };
    }

    let superAdmin = await AdminModel.findOne({
      sponsorId: normalizedSponsorId,
      role: USER_ROLES.SUPERADMIN,
      isActive: true,
    }).lean();

    if (
      !superAdmin &&
      sponsorIdPattern.test(normalizedSponsorId) &&
      normalizedSponsorId === "BKS000000"
    ) {
      await seedSuperAdmin();
      superAdmin = await AdminModel.findOne({
        sponsorId: normalizedSponsorId,
        role: USER_ROLES.SUPERADMIN,
        isActive: true,
      }).lean();
    }

    if (!superAdmin) {
      throw new ApiError(404, "Sponsor not found");
    }

    return {
      sponsorId: superAdmin.sponsorId,
      sponsorName: superAdmin.username,
      sponsorStatus: superAdmin.isActive ? "active" : "inactive",
      active: superAdmin.isActive,
      sponsorType: "superadmin",
    };
  },
};
