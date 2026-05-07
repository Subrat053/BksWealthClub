import { ApiResponse } from "../../core/ApiResponse.js";
import { asyncHandler } from "../../core/asyncHandler.js";
import { userService } from "./user.service.js";

export const getProfileController = asyncHandler(async (req, res) => {
  const data = await userService.getProfile(req.auth.sub);
  res.json(new ApiResponse({ message: "Profile fetched", data }));
});

export const updateProfileController = asyncHandler(async (req, res) => {
  // Map frontend field names to database field names
  const mappedPayload = {
    fullName: req.body.name || undefined,
    phone: req.body.mobile || undefined,
    bepAddress: req.body.walletAddresses?.[0]?.address || undefined,
  };

  // Remove undefined values
  Object.keys(mappedPayload).forEach((key) => {
    if (mappedPayload[key] === undefined) delete mappedPayload[key];
  });

  const data = await userService.updateProfile(req.auth.sub, mappedPayload);
  res.json(new ApiResponse({ message: "Profile updated", data }));
});

export const changePasswordController = asyncHandler(async (req, res) => {
  const data = await userService.changePassword(req.auth.sub, req.body);
  res.json(new ApiResponse({ message: "Password updated", data }));
});
