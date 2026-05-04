import { ApiResponse } from "../../core/ApiResponse.js";
import { asyncHandler } from "../../core/asyncHandler.js";
import { twoFactorService } from "./twofactor.service.js";

const getAuthUserId = (req) =>
  req.auth?.userId || req.auth?.sub || req.auth?.adminId;

export const setupTwoFactorController = asyncHandler(async (req, res) => {
  const data = await twoFactorService.setup(getAuthUserId(req));
  res.json(new ApiResponse({ message: "2FA setup generated", data }));
});

export const verifyTwoFactorController = asyncHandler(async (req, res) => {
  const data = await twoFactorService.verifyAndEnable({
    userId: getAuthUserId(req),
    otp: req.body.otp,
  });

  res.json(new ApiResponse({ message: "2FA enabled successfully", data }));
});

export const validateTwoFactorController = asyncHandler(async (req, res) => {
  const data = await twoFactorService.validate({
    userId: getAuthUserId(req),
    otp: req.body.otp,
  });

  res.json(new ApiResponse({ message: "OTP validated", data }));
});
