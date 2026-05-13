import express from "express";
import {
  getMyReferrals,
  getMyReferralTree,
  getAdminReferralTree,
  getAdminReferralReport,
  validateSponsorId,
} from "./referral.controller.js";

import { protect, userOnly, adminOnly } from "../../middleware/auth.middleware.js";

export const referralRouter = express.Router();

// PUBLIC: Validate sponsor ID (used during registration)
referralRouter.post("/validate-sponsor", validateSponsorId);

// USER: Logged-in user endpoints
referralRouter.get("/my-referrals", protect, userOnly, getMyReferrals);
referralRouter.get("/my-tree", protect, userOnly, getMyReferralTree);

// ADMIN: Admin endpoints
referralRouter.get("/admin/tree", protect, adminOnly, getAdminReferralTree);
referralRouter.get("/admin/report", protect, adminOnly, getAdminReferralReport);
