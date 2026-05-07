import { Router } from "express";
import { authMiddleware, adminOnly } from "../../middleware/auth.middleware.js";
import {
  getMemberTreeController,
  getCommunityTreeController,
  getPoolStatsController,
} from "./autopool.controller.js";

export const autopoolRouter = Router();

// Member routes
autopoolRouter.get("/my-tree", authMiddleware, getMemberTreeController);

// Admin routes
autopoolRouter.get(
  "/community-tree",
  authMiddleware,
  adminOnly,
  getCommunityTreeController,
);
autopoolRouter.get("/stats", authMiddleware, adminOnly, getPoolStatsController);
