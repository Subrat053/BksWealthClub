/**
 * AutoPool 3x3 Routes
 *
 * API endpoints for 3x3 Matrix AutoPool system
 */

import { Router } from "express";
import { authMiddleware, adminOnly } from "../../middleware/auth.middleware.js";
import {
  getAutoPoolTree,
  getQueueNodes,
  getQueueStatus,
  getCompletedNodes,
  getOperationalAdminMyTree,
  getUserAutoPoolDetails,
  processQueueManually,
  getMyAutoPoolNodes,
  getMyRebirths,
  getMyAutoPoolSummary,
  getIndividualAutopoolSummary,
  getIndividualAutopoolDetails,
  getIndividualAutopoolTree,
  getMyFunds,
  getMyFundTransactions,
  getMyUpgradeIds,
  getUserFundsAdmin,
  getUserFundTransactionsAdmin,
  getUserUpgradeIdsAdmin,
} from "./autopool-3x3.controller.js";
import {
  getPoolFundSummary,
  getPoolFundLedger,
  getCompanyFundSummary,
  getUserPoolFund,
} from "./autopool-fund.controller.js";

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
 * Admin: Get queue list
 */
autopool3x3Router.get("/admin/queue", authMiddleware, adminOnly, getQueueNodes);

/**
 * Admin: Get queue status/stats
 */
autopool3x3Router.get(
  "/admin/stats",
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

/**
 * Admin: Individual Autopool summarize report
 */
autopool3x3Router.get(
  "/admin/individuals",
  authMiddleware,
  adminOnly,
  getIndividualAutopoolSummary,
);

/**
 * Admin: Individual Autopool detailed report per user
 */
autopool3x3Router.get(
  "/admin/individuals/:userId",
  authMiddleware,
  adminOnly,
  getIndividualAutopoolDetails,
);

/**
 * Admin: Scoped individual autopool tree per user
 */
autopool3x3Router.get(
  "/admin/individuals/:userId/tree",
  authMiddleware,
  adminOnly,
  getIndividualAutopoolTree,
);

/**
 * Operational Admin: Get scoped AutoPool tree
 */
autopool3x3Router.get(
  "/operational-admin/my-tree",
  authMiddleware,
  getOperationalAdminMyTree,
);

/**
 * Admin: Get Pool Fund Summary
 */
autopool3x3Router.get(
  "/admin/pool-fund-summary",
  authMiddleware,
  adminOnly,
  getPoolFundSummary,
);

/**
 * Admin: Get Pool Fund Ledger
 */
autopool3x3Router.get(
  "/admin/pool-fund-ledger",
  authMiddleware,
  adminOnly,
  getPoolFundLedger,
);

/**
 * Admin: Get Company Fund Summary
 */
autopool3x3Router.get(
  "/admin/company-fund-summary",
  authMiddleware,
  adminOnly,
  getCompanyFundSummary,
);

/**
 * Admin: Get specific user pool fund
 */
autopool3x3Router.get(
  "/admin/user-pool-fund/:userId",
  authMiddleware,
  adminOnly,
  getUserPoolFund,
);

/**
 * Admin: Get specific user's isolated autopool funds
 */
autopool3x3Router.get(
  "/admin/user-funds/:userId",
  authMiddleware,
  adminOnly,
  getUserFundsAdmin,
);

/**
 * Admin: Get specific user's autopool fund transactions ledger
 */
autopool3x3Router.get(
  "/admin/user-fund-transactions/:userId",
  authMiddleware,
  adminOnly,
  getUserFundTransactionsAdmin,
);

/**
 * Admin: Get specific user's upgrade/alias IDs
 */
autopool3x3Router.get(
  "/admin/user-upgrade-ids/:userId",
  authMiddleware,
  adminOnly,
  getUserUpgradeIdsAdmin,
);

// ─── User Routes ────────────────────────────────────────────────────────────

/**
 * User: Get my AutoPool nodes
 */
autopool3x3Router.get("/my", authMiddleware, getMyAutoPoolNodes);

/**
 * User: Get my rebirth IDs
 */
autopool3x3Router.get("/my-rebirths", authMiddleware, getMyRebirths);

/**
 * User: Get my AutoPool summary
 */
autopool3x3Router.get("/my/summary", authMiddleware, getMyAutoPoolSummary);

/**
 * User: Get my pool fund ledger
 */
autopool3x3Router.get("/my/pool-fund", authMiddleware, getUserPoolFund);

/**
 * User: Get my isolated autopool funds
 */
autopool3x3Router.get("/my/funds", authMiddleware, getMyFunds);

/**
 * User: Get my autopool fund transactions ledger
 */
autopool3x3Router.get("/my/fund-transactions", authMiddleware, getMyFundTransactions);

/**
 * User: Get my upgrade/alias IDs
 */
autopool3x3Router.get("/my/upgrade-ids", authMiddleware, getMyUpgradeIds);

export default autopool3x3Router;
