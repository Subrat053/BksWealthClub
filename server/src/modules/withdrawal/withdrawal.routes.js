import { Router } from "express";
import { authMiddleware, adminOnly } from "../../middleware/auth.middleware.js";
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
withdrawalRouter.get("/admin/pending", adminOnly, getPendingWithdrawalController);
withdrawalRouter.post("/admin/:id/approve", adminOnly, approveWithdrawalController);
withdrawalRouter.post("/admin/:id/reject", adminOnly, validate(rejectWithdrawalSchema), rejectWithdrawalController);
