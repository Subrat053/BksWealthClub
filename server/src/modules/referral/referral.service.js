import { ApiError } from "../../core/ApiError.js";
import { referralRepository } from "./referral.repository.js";

export const referralService = {
  findSponsorById: async (sponsorId) => referralRepository.findSponsorById(sponsorId),

  createReferralRelation: async (payload) => referralRepository.createRelation(payload),

  getDirectReferralStats: async (sponsorUserRef) => {
    const directs = await referralRepository.getDirectsBySponsor(sponsorUserRef);
    return {
      totalDirects: directs.length,
      members: directs,
    };
  },

  validateSponsor: async (sponsorId) => {
    const sponsor = await referralRepository.findSponsorById(sponsorId);
    if (!sponsor) throw new ApiError(404, "Sponsor not found");

    return {
      sponsorId: sponsor.username,
      sponsorName: sponsor.name,
      sponsorStatus: sponsor.accountStatus,
      active: sponsor.accountStatus === "active",
    };
  },
};
