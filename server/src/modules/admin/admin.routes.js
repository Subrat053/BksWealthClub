import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { adminMiddleware } from "../../middleware/admin.middleware.js";
import {
  getAdminSummaryController,
  getUsersController,
  updateUserStatusController,
} from "./admin.controller.js";

export const adminRouter = Router();

adminRouter.use(authMiddleware, adminMiddleware);
adminRouter.get("/summary", getAdminSummaryController);
adminRouter.get("/users", getUsersController);
adminRouter.patch("/users/:id/status", updateUserStatusController);
