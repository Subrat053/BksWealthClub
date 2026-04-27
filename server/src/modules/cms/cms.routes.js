import { Router } from "express";
import { authMiddleware, adminOnly } from "../../middleware/auth.middleware.js";
import {
  getContactController,
  getFaqController,
  getWebsiteContentController,
  updateContactController,
  updateSectionController,
  upsertFaqController,
} from "./cms.controller.js";

export const cmsRouter = Router();

cmsRouter.get("/website", getWebsiteContentController);
cmsRouter.get("/faqs", getFaqController);
cmsRouter.get("/contact", getContactController);

cmsRouter.use(authMiddleware, adminOnly);
cmsRouter.put("/sections/:key", updateSectionController);
cmsRouter.put("/faqs", upsertFaqController);
cmsRouter.put("/contact", updateContactController);
