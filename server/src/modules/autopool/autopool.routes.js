import { Router } from "express";
import { authMiddleware, adminOnly } from "../../middleware/auth.middleware.js";
import {
  getMemberTreeController,
  getCommunityTreeController,
  getPoolStatsController,
} from "./autopool.controller.js";
import {
  getQueue,
  getTree,
  getStats,
  getUserDetail,
  getMyAutoPool,
  processQueue
} from "./autopool-new.controller.js";

export const autopoolRouter = Router();

// Member routes
autopoolRouter.get("/my-tree", authMiddleware, getMemberTreeController);
autopoolRouter.get("/my", authMiddleware, getMyAutoPool);

// Admin routes
autopoolRouter.get("/admin/queue", authMiddleware, adminOnly, getQueue);
autopoolRouter.get("/admin/tree", authMiddleware, adminOnly, getTree);
autopoolRouter.get("/admin/stats", authMiddleware, adminOnly, getStats);
autopoolRouter.get("/admin/user/:userId", authMiddleware, adminOnly, getUserDetail);
autopoolRouter.post("/admin/process-queue", authMiddleware, adminOnly, processQueue);

// Old routes
autopoolRouter.get(
  "/community-tree",
  authMiddleware,
  adminOnly,
  getCommunityTreeController,
);
autopoolRouter.get("/stats", authMiddleware, adminOnly, getPoolStatsController);
