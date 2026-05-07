import { Router } from "express";
import { authMiddleware, adminOnly } from "../../middleware/auth.middleware.js";
import { requireTwoFactorOtp } from "../../middleware/twofactor.middleware.js";
import {
  createDepositController,
  getMyDepositsController,
  getPendingDepositsController,
  approveDepositController,
  rejectDepositController,
} from "./deposit.controller.js";

export const depositRouter = Router();

// ── Member routes ─────────────────────────────────────────────────────────────
depositRouter.post(
  "/",
  authMiddleware,
  requireTwoFactorOtp,
  createDepositController,
);
depositRouter.get("/my", authMiddleware, getMyDepositsController);

// ── Admin routes ──────────────────────────────────────────────────────────────
depositRouter.get(
  "/pending",
  authMiddleware,
  adminOnly,
  getPendingDepositsController,
);
depositRouter.patch(
  "/:id/approve",
  authMiddleware,
  adminOnly,
  approveDepositController,
);
depositRouter.patch(
  "/:id/reject",
  authMiddleware,
  adminOnly,
  rejectDepositController,
);
