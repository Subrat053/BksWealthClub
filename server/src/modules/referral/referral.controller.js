import { ApiResponse } from "../../core/ApiResponse.js";
import { asyncHandler } from "../../core/asyncHandler.js";
import { referralService } from "./referral.service.js";

export const validateSponsorController = asyncHandler(async (req, res) => {
  const data = await referralService.validateSponsor(req.body.sponsorId);
  res.json(new ApiResponse({ message: "Sponsor check complete", data }));
});

export const directStatsController = asyncHandler(async (req, res) => {
  const data = await referralService.getDirectReferralStats(req.user.sub);
  res.json(new ApiResponse({ message: "Direct stats fetched", data }));
});
