import { ApiResponse } from "../../core/ApiResponse.js";
import { asyncHandler } from "../../core/asyncHandler.js";
import { userService } from "./user.service.js";

export const getProfileController = asyncHandler(async (req, res) => {
  const data = await userService.getProfile(req.user.sub);
  res.json(new ApiResponse({ message: "Profile fetched", data }));
});

export const updateProfileController = asyncHandler(async (req, res) => {
  const data = await userService.updateProfile(req.user.sub, req.body);
  res.json(new ApiResponse({ message: "Profile updated", data }));
});

export const changePasswordController = asyncHandler(async (req, res) => {
  const data = await userService.changePassword(req.user.sub, req.body);
  res.json(new ApiResponse({ message: "Password updated", data }));
});
