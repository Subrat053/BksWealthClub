import { ApiResponse } from "../../core/ApiResponse.js";
import { asyncHandler } from "../../core/asyncHandler.js";
import { authService } from "./auth.service.js";

export const validateSponsorController = asyncHandler(async (req, res) => {
  const data = await authService.validateSponsor(req.body.sponsorId);
  res.json(new ApiResponse({ message: "Sponsor validated", data }));
});

export const registerController = asyncHandler(async (req, res) => {
  const data = await authService.registerMember(req.body);
  res.status(201).json(new ApiResponse({ message: "Registration successful", data }));
});

export const loginController = asyncHandler(async (req, res) => {
  const data = await authService.loginMember(req.body);
  res.json(new ApiResponse({ message: "Login successful", data }));
});

export const adminLoginController = asyncHandler(async (req, res) => {
  const data = await authService.loginAdmin(req.body);
  res.json(new ApiResponse({ message: "Admin login successful", data }));
});

export const refreshController = asyncHandler(async (req, res) => {
  const token = req.body.refreshToken || req.cookies?.refreshToken;
  const data = await authService.refreshTokens(token);
  res.json(new ApiResponse({ message: "Tokens refreshed", data }));
});

export const logoutController = asyncHandler(async (_req, res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.json(new ApiResponse({ message: "Logged out successfully" }));
});

export const forgotPasswordController = asyncHandler(async (_req, res) => {
  res.json(new ApiResponse({ message: "Forgot password placeholder endpoint" }));
});

export const resetPasswordController = asyncHandler(async (_req, res) => {
  res.json(new ApiResponse({ message: "Reset password placeholder endpoint" }));
});
