import { Router } from "express";
import { adminMiddleware } from "../../middleware/admin.middleware.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import {
  approveDepositController,
  createDepositController,
  getMyDepositsController,
  getPendingDepositsController,
  rejectDepositController,
} from "./deposit.controller.js";

export const depositRouter = Router();

depositRouter.use(authMiddleware);
depositRouter.post("/", createDepositController);
depositRouter.get("/mine", getMyDepositsController);
depositRouter.get("/admin/pending", adminMiddleware, getPendingDepositsController);
depositRouter.post("/admin/:id/approve", adminMiddleware, approveDepositController);
depositRouter.post("/admin/:id/reject", adminMiddleware, rejectDepositController);
