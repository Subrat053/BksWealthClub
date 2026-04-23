import { ApiError } from "../../core/ApiError.js";
import { referralRepository } from "./referral.repository.js";
import { AdminModel } from "../admin/admin.model.js";
import { USER_ROLES } from "../../common/enums/index.js";

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
    const sponsor =
      await referralRepository.findSponsorById(normalizedSponsorId);

    if (sponsor) {
      return {
        sponsorId: sponsor.memberId,
        sponsorName: sponsor.fullName,
        sponsorStatus: sponsor.status,
        active: sponsor.status === "active",
        sponsorType: "user",
      };
    }

    const superAdmin = await AdminModel.findOne({
      sponsorId: normalizedSponsorId,
      role: USER_ROLES.SUPERADMIN,
      isActive: true,
    }).lean();

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
