import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { adminMiddleware } from "../../middleware/admin.middleware.js";
import { getAdminDashboardController, getMemberDashboardController } from "./dashboard.controller.js";

export const dashboardRouter = Router();

dashboardRouter.get("/member", authMiddleware, getMemberDashboardController);
dashboardRouter.get("/admin", authMiddleware, adminMiddleware, getAdminDashboardController);
