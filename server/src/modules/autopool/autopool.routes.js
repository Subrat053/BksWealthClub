import { Router } from "express";
import { authMiddleware, adminOnly } from "../../middleware/auth.middleware.js";
import {
  getAutopoolQueueController,
  processAutopoolQueueController,
  getAutopoolMatrixController,
  getAutopoolNodeController,
  getMyRebirthTreeController,
  getRebirthTreeByUserController,
} from "./autopool.controller.js";
import {
  getQueue as getQueueV2,
  getTree as getTreeV2,
  getStats as getStatsV2,
  getUserDetail as getUserDetailV2,
  processQueue as processQueueV2,
} from "./autopool-new.controller.js";

export const autopoolRouter = Router();

// Member routes
autopoolRouter.get("/rebirth-tree/my", authMiddleware, getMyRebirthTreeController);

// Legacy admin-compatible routes (used by admin frontend)
autopoolRouter.get("/admin/queue", authMiddleware, adminOnly, getQueueV2);
autopoolRouter.get("/admin/tree", authMiddleware, adminOnly, getTreeV2);
autopoolRouter.get("/admin/stats", authMiddleware, adminOnly, getStatsV2);
autopoolRouter.get(
  "/admin/user/:userId",
  authMiddleware,
  adminOnly,
  getUserDetailV2,
);
autopoolRouter.post(
  "/admin/process-queue",
  authMiddleware,
  adminOnly,
  processQueueV2,
);

// Admin routes
autopoolRouter.get(
  "/rebirth-tree/:userId",
  authMiddleware,
  adminOnly,
  getRebirthTreeByUserController,
);
autopoolRouter.get("/queue", authMiddleware, adminOnly, getAutopoolQueueController);
autopoolRouter.post(
  "/process",
  authMiddleware,
  adminOnly,
  processAutopoolQueueController,
);
autopoolRouter.get("/matrix", authMiddleware, adminOnly, getAutopoolMatrixController);
autopoolRouter.get(
  "/matrix/:id",
  authMiddleware,
  adminOnly,
  getAutopoolNodeController,
);
