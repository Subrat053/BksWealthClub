import { User } from "../user/user.model.js";
import { ReferralRelationModel } from "./referral.model.js";
import { ReferralTree } from "./referral-tree.model.js";

export const referralRepository = {
  findSponsorById: async (sponsorId) =>
    User.findOne({ memberId: sponsorId }).lean(),

  findSponsorByIdentifier: async (identifier) =>
    User.findOne({
      $or: [{ memberId: identifier }, { referralCode: identifier }],
    }).lean(),

  createRelation: async (payload) => ReferralRelationModel.create(payload),

  findReferralTreeNode: async (userId, session = null) => {
    const query = ReferralTree.findOne({ userId });
    if (session) query.session(session);
    return query.lean();
  },

  createReferralTreeNode: async (payload, session = null) => {
    const opts = { upsert: true, new: true, setDefaultsOnInsert: true };
    if (session) opts.session = session;
    return ReferralTree.findOneAndUpdate(
      { userId: payload.userId },
      { $setOnInsert: payload },
      opts,
    );
  },

  getDirectsBySponsor: async (sponsorUserRef) =>
    ReferralRelationModel.find({ sponsorUserRef })
      .populate("referredUserRef", "username name accountStatus")
      .lean(),
};
