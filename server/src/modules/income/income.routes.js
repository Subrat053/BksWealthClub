import { Router } from "express";
import { authMiddleware, adminOnly } from "../../middleware/auth.middleware.js";
import {
  // Existing controllers (preserved)
  getIncomeSummaryController,
  getIncomeHistoryController,
  // Admin controllers
  triggerDistributionController,
  getIncomeLogsController,
  getUserIncomeLogsController,
  getFundsSummaryController,
  getFundTransactionsController,
  getDepositDistributionController,
  getAdminUsersWithRebirthsController,
  getUserIncomeSummaryController,
  // User controllers
  getMyWalletController,
  getMyIncomeLogsController,
  getMyRebirthIdsController,
} from "./income.controller.js";

export const incomeRouter = Router();

// ─── Existing Routes (preserved) ─────────────────────────────────────────────
incomeRouter.use(authMiddleware);
incomeRouter.get("/summary", getIncomeSummaryController);
incomeRouter.get("/history", getIncomeHistoryController);

// ─── User Routes ─────────────────────────────────────────────────────────────
incomeRouter.get("/my-wallet", getMyWalletController);
incomeRouter.get("/my-logs", getMyIncomeLogsController);
incomeRouter.get("/my-rebirth-ids", getMyRebirthIdsController);

// ─── Admin Routes ────────────────────────────────────────────────────────────
incomeRouter.post(
  "/admin/distribute/:depositId",
  adminOnly,
  triggerDistributionController,
);
incomeRouter.get(
  "/admin/logs",
  adminOnly,
  getIncomeLogsController,
);
incomeRouter.get(
  "/admin/user/:userId",
  adminOnly,
  getUserIncomeLogsController,
);
incomeRouter.get(
  "/admin/funds-summary",
  adminOnly,
  getFundsSummaryController,
);
incomeRouter.get(
  "/admin/fund-transactions",
  adminOnly,
  getFundTransactionsController,
);
incomeRouter.get(
  "/admin/deposit/:depositId/distribution",
  adminOnly,
  getDepositDistributionController,
);
incomeRouter.get(
  "/admin/users-with-rebirths",
  adminOnly,
  getAdminUsersWithRebirthsController,
);
incomeRouter.get(
  "/admin/user/:userId/income-summary",
  adminOnly,
  getUserIncomeSummaryController,
);
