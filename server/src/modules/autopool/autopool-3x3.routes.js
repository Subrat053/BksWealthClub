/**
 * AutoPool 3x3 Routes
 * 
 * API endpoints for 3x3 Matrix AutoPool system
 */

import { Router } from "express";
import { authMiddleware, adminOnly } from "../../middleware/auth.middleware.js";
import {
  getAutoPoolTree,
  getQueueStatus,
  getCompletedNodes,
  getUserAutoPoolDetails,
  processQueueManually,
  getMyAutoPoolNodes,
  getMyRebirths,
  getMyAutoPoolSummary,
} from "./autopool-3x3.controller.js";

export const autopool3x3Router = Router();

// ─── Admin Routes ────────────────────────────────────────────────────────────

/**
 * Admin: Get complete AutoPool tree
 */
autopool3x3Router.get(
  "/admin/tree",
  authMiddleware,
  adminOnly,
  getAutoPoolTree,
);

/**
 * Admin: Get queue status
 */
autopool3x3Router.get(
  "/admin/queue",
  authMiddleware,
  adminOnly,
  getQueueStatus,
);

/**
 * Admin: Get completed nodes
 */
autopool3x3Router.get(
  "/admin/completed",
  authMiddleware,
  adminOnly,
  getCompletedNodes,
);

/**
 * Admin: Get user AutoPool details
 */
autopool3x3Router.get(
  "/admin/user/:userId",
  authMiddleware,
  adminOnly,
  getUserAutoPoolDetails,
);

/**
 * Admin: Process queue manually
 */
autopool3x3Router.post(
  "/admin/process-queue",
  authMiddleware,
  adminOnly,
  processQueueManually,
);

// ─── User Routes ────────────────────────────────────────────────────────────

/**
 * User: Get my AutoPool nodes
 */
autopool3x3Router.get(
  "/my",
  authMiddleware,
  getMyAutoPoolNodes,
);

/**
 * User: Get my rebirth IDs
 */
autopool3x3Router.get(
  "/my-rebirths",
  authMiddleware,
  getMyRebirths,
);

/**
 * User: Get my AutoPool summary
 */
autopool3x3Router.get(
  "/my/summary",
  authMiddleware,
  getMyAutoPoolSummary,
);

export default autopool3x3Router;
