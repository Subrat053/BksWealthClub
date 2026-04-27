import { Router } from "express";
import { authMiddleware, adminOnly } from "../../middleware/auth.middleware.js";
import {
  getAdminDashboardController,
  getMemberDashboardController,
} from "./dashboard.controller.js";

export const dashboardRouter = Router();

dashboardRouter.get("/member", authMiddleware, getMemberDashboardController);
dashboardRouter.get("/admin", authMiddleware, adminOnly, getAdminDashboardController);
