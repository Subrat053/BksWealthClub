import { Router } from "express";
import { authMiddleware, adminOnly } from "../../middleware/auth.middleware.js";
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
depositRouter.get("/admin/pending", adminOnly, getPendingDepositsController);
depositRouter.post("/admin/:id/approve", adminOnly, approveDepositController);
depositRouter.post("/admin/:id/reject", adminOnly, rejectDepositController);
