import { ApiResponse } from "../../core/ApiResponse.js";
import { asyncHandler } from "../../core/asyncHandler.js";
import { settingsService } from "./settings.service.js";

export const getSettingsController = asyncHandler(async (_req, res) => {
  const data = await settingsService.getAllSettings();
  res.json(new ApiResponse({ message: "Settings fetched", data }));
});

export const updateSettingController = asyncHandler(async (req, res) => {
  const data = await settingsService.upsertSetting(req.body);
  res.json(new ApiResponse({ message: "Setting updated", data }));
});

export const getRulesController = asyncHandler(async (_req, res) => {
  const data = await settingsService.getPublicRules();
  res.json(new ApiResponse({ message: "Public rules fetched", data }));
});
