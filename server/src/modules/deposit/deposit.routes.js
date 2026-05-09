import { Router } from "express";
import { authMiddleware, adminOnly } from "../../middleware/auth.middleware.js";
import {
  createDepositController,
  getMyDepositsController,
  getPendingDepositsController,
  getAllDepositsController,
  approveDepositController,
  rejectDepositController,
} from "./deposit.controller.js";

export const depositRouter = Router();

// ── Member routes ─────────────────────────────────────────────────────────────
depositRouter.post("/", authMiddleware, createDepositController);
depositRouter.get("/my", authMiddleware, getMyDepositsController);

// ── Admin routes ──────────────────────────────────────────────────────────────
depositRouter.get(
  "/pending",
  authMiddleware,
  adminOnly,
  getPendingDepositsController,
);
depositRouter.get("/all", authMiddleware, adminOnly, getAllDepositsController);
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
