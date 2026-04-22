import { cmsRepository } from "./cms.repository.js";

export const cmsService = {
  getPublicWebsiteContent: async () => {
    const [navbar, hero, about, services, projects, faqs, contact, footer] = await Promise.all([
      cmsRepository.getContentByKey("navbar"),
      cmsRepository.getContentByKey("hero"),
      cmsRepository.getContentByKey("about"),
      cmsRepository.getContentByKey("services"),
      cmsRepository.getContentByKey("projects"),
      cmsRepository.getFaqs(),
      cmsRepository.getContactInfo(),
      cmsRepository.getContentByKey("footer"),
    ]);

    return { navbar, hero, about, services, projects, faqs, contact, footer };
  },

  updateSection: async ({ key, payload }) => cmsRepository.upsertContentByKey(key, payload),
  getFaqs: async () => cmsRepository.getFaqs(),
  updateFaq: async (payload) => cmsRepository.upsertFaq(payload),
  getContactInfo: async () => cmsRepository.getContactInfo(),
  updateContactInfo: async (payload) => cmsRepository.upsertContactInfo(payload),
};
