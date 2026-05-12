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
  getNodeById,
  processQueue,
} from "./autopool-new.controller.js";
import autopoolV2Routes from "./autopool-v2.routes.js";

export const autopoolRouter = Router();

// AUTOPOOL HOOK — added by autopool module
autopoolRouter.use("/", autopoolV2Routes);

// Member routes
autopoolRouter.get("/my-tree", authMiddleware, getMemberTreeController);
autopoolRouter.get("/my", authMiddleware, getMyAutoPool);
autopoolRouter.get("/my-nodes", authMiddleware, getMyAutoPool);

// Admin routes
autopoolRouter.get("/admin/queue", authMiddleware, adminOnly, getQueue);
autopoolRouter.get("/admin/tree", authMiddleware, adminOnly, getTree);
autopoolRouter.get("/admin/stats", authMiddleware, adminOnly, getStats);
autopoolRouter.get(
  "/admin/user/:userId",
  authMiddleware,
  adminOnly,
  getUserDetail,
);
autopoolRouter.post(
  "/admin/process-queue",
  authMiddleware,
  adminOnly,
  processQueue,
);

// New API routes (per spec)
autopoolRouter.post("/process", authMiddleware, adminOnly, processQueue);
autopoolRouter.get("/tree", authMiddleware, adminOnly, getTree);
autopoolRouter.get("/queue", authMiddleware, adminOnly, getQueue);
autopoolRouter.get("/node/:id", authMiddleware, adminOnly, getNodeById);

// Old routes
autopoolRouter.get(
  "/community-tree",
  authMiddleware,
  adminOnly,
  getCommunityTreeController,
);
autopoolRouter.get("/stats", authMiddleware, adminOnly, getPoolStatsController);
