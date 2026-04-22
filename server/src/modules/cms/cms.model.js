import mongoose from "mongoose";

const cmsContentSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    title: { type: String, default: "" },
    body: { type: String, default: "" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    media: [
      {
        url: { type: String, default: "" },
        publicId: { type: String, default: "" },
        alt: { type: String, default: "" },
      },
    ],
    seo: {
      title: { type: String, default: "" },
      description: { type: String, default: "" },
      keywords: { type: [String], default: [] },
    },
  },
  { timestamps: true },
);

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const contactInfoSchema = new mongoose.Schema(
  {
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    socialLinks: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

export const CMSContentModel = mongoose.models.CMSContent || mongoose.model("CMSContent", cmsContentSchema);
export const FAQModel = mongoose.models.FAQ || mongoose.model("FAQ", faqSchema);
export const ContactInfoModel = mongoose.models.ContactInfo || mongoose.model("ContactInfo", contactInfoSchema);
