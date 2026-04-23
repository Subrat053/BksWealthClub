import { User } from "../user/user.model.js";
import { ReferralRelationModel } from "./referral.model.js";

export const referralRepository = {
  findSponsorById: async (sponsorId) =>
    User.findOne({ memberId: sponsorId }).lean(),

  createRelation: async (payload) => ReferralRelationModel.create(payload),

  getDirectsBySponsor: async (sponsorUserRef) =>
    ReferralRelationModel.find({ sponsorUserRef })
      .populate("referredUserRef", "username name accountStatus")
      .lean(),
};
