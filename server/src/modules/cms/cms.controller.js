import { ApiResponse } from "../../core/ApiResponse.js";
import { asyncHandler } from "../../core/asyncHandler.js";
import { cmsService } from "./cms.service.js";

export const getWebsiteContentController = asyncHandler(async (_req, res) => {
  const data = await cmsService.getPublicWebsiteContent();
  res.json(new ApiResponse({ message: "Website content fetched", data }));
});

export const updateSectionController = asyncHandler(async (req, res) => {
  const data = await cmsService.updateSection({ key: req.params.key, payload: req.body });
  res.json(new ApiResponse({ message: "Section updated", data }));
});

export const getFaqController = asyncHandler(async (_req, res) => {
  const data = await cmsService.getFaqs();
  res.json(new ApiResponse({ message: "FAQs fetched", data }));
});

export const upsertFaqController = asyncHandler(async (req, res) => {
  const data = await cmsService.updateFaq(req.body);
  res.json(new ApiResponse({ message: "FAQ updated", data }));
});

export const getContactController = asyncHandler(async (_req, res) => {
  const data = await cmsService.getContactInfo();
  res.json(new ApiResponse({ message: "Contact info fetched", data }));
});

export const updateContactController = asyncHandler(async (req, res) => {
  const data = await cmsService.updateContactInfo(req.body);
  res.json(new ApiResponse({ message: "Contact info updated", data }));
});
