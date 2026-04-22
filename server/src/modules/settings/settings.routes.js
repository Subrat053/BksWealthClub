import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { adminMiddleware } from "../../middleware/admin.middleware.js";
import { getRulesController, getSettingsController, updateSettingController } from "./settings.controller.js";

export const settingsRouter = Router();

settingsRouter.get("/public-rules", getRulesController);
settingsRouter.get("/", authMiddleware, adminMiddleware, getSettingsController);
settingsRouter.put("/", authMiddleware, adminMiddleware, updateSettingController);
