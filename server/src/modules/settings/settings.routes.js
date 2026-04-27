import { Router } from "express";
import { authMiddleware, adminOnly } from "../../middleware/auth.middleware.js";
import { getRulesController, getSettingsController, updateSettingController } from "./settings.controller.js";

export const settingsRouter = Router();

settingsRouter.get("/public-rules", getRulesController);
settingsRouter.get("/", authMiddleware, adminOnly, getSettingsController);
settingsRouter.put("/", authMiddleware, adminOnly, updateSettingController);
