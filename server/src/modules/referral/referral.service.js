import { ApiError } from "../../core/ApiError.js";
import { referralRepository } from "./referral.repository.js";
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
        active: sponsor.status === "active" || sponsor.status === "pending",
        sponsorType: "user",
      };
    }

    throw new ApiError(404, "Sponsor not found");
  },
};
