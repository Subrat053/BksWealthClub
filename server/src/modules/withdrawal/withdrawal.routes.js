import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { adminMiddleware } from "../../middleware/admin.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import {
  approveWithdrawalController,
  createWithdrawalController,
  getPendingWithdrawalController,
  getWithdrawalHistoryController,
  rejectWithdrawalController,
} from "./withdrawal.controller.js";
import { createWithdrawalSchema, rejectWithdrawalSchema } from "./withdrawal.validation.js";

export const withdrawalRouter = Router();

withdrawalRouter.use(authMiddleware);
withdrawalRouter.post("/", validate(createWithdrawalSchema), createWithdrawalController);
withdrawalRouter.get("/mine", getWithdrawalHistoryController);
withdrawalRouter.get("/admin/pending", adminMiddleware, getPendingWithdrawalController);
withdrawalRouter.post("/admin/:id/approve", adminMiddleware, approveWithdrawalController);
withdrawalRouter.post("/admin/:id/reject", adminMiddleware, validate(rejectWithdrawalSchema), rejectWithdrawalController);
