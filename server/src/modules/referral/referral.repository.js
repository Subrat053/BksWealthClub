import { UserModel } from "../user/user.model.js";
import { ReferralRelationModel } from "./referral.model.js";

export const referralRepository = {
  findSponsorById: async (sponsorId) => UserModel.findOne({ username: sponsorId, isDeleted: false }).lean(),

  createRelation: async (payload) => ReferralRelationModel.create(payload),

  getDirectsBySponsor: async (sponsorUserRef) =>
    ReferralRelationModel.find({ sponsorUserRef }).populate("referredUserRef", "username name accountStatus").lean(),
};
