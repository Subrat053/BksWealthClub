import { CMSContentModel, ContactInfoModel, FAQModel } from "./cms.model.js";

export const cmsRepository = {
  getContentByKey: async (key) => CMSContentModel.findOne({ key }).lean(),
  upsertContentByKey: async (key, payload) =>
    CMSContentModel.findOneAndUpdate({ key }, payload, { upsert: true, new: true }).lean(),

  getFaqs: async () => FAQModel.find({ isActive: true }).sort({ order: 1 }).lean(),
  upsertFaq: async (payload) => FAQModel.findOneAndUpdate({ question: payload.question }, payload, { upsert: true, new: true }).lean(),

  getContactInfo: async () => ContactInfoModel.findOne({}).sort({ updatedAt: -1 }).lean(),
  upsertContactInfo: async (payload) => ContactInfoModel.findOneAndUpdate({}, payload, { upsert: true, new: true }).lean(),
};
