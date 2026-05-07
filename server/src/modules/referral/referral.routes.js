import express from "express";
import {
  getMyReferrals,
  getMyReferralTree,
  getAdminReferralTree,
  getAdminReferralReport,
  validateSponsor,
} from "./referral.controller.js";

import { protect, userOnly, adminOnly } from "../../middleware/auth.middleware.js";

export const referralRouter = express.Router();

referralRouter.get("/my-referrals", protect, userOnly, getMyReferrals);
referralRouter.get("/my-tree", protect, userOnly, getMyReferralTree);

referralRouter.post("/validate-sponsor", validateSponsor);

referralRouter.get("/admin/tree", protect, adminOnly, getAdminReferralTree);
referralRouter.get("/admin/report", protect, adminOnly, getAdminReferralReport);
