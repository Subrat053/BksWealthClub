import { ApiResponse } from "../../core/ApiResponse.js";
import { asyncHandler } from "../../core/asyncHandler.js";
import { incomeService } from "./income.service.js";
import {
  distributeDepositIncome,
  getAllIncomeLogs,
  getUserIncomeLogs,
  getFundsSummary,
  getFundTransactions,
  getDistributionByDeposit,
  getUserWallet,
  getUserRebirthIds,
  getAdminUsersWithRebirths,
  getUserIncomeSummary,
} from "./incomeDistribution.service.js";

// ─── Existing Controllers (preserved) ────────────────────────────────────────

export const getIncomeSummaryController = asyncHandler(async (req, res) => {
  const data = await incomeService.getSummary(req.auth.sub);
  res.json(new ApiResponse({ message: "Income summary fetched", data }));
});

export const getIncomeHistoryController = asyncHandler(async (req, res) => {
  const data = await incomeService.getHistory(req.auth.sub, req.query);
  res.json(new ApiResponse({ message: "Income history fetched", data }));
});

// ─── Admin: Trigger Distribution ─────────────────────────────────────────────

export const triggerDistributionController = asyncHandler(async (req, res) => {
  const { depositId } = req.params;
  const { DepositModel } = await import("../deposit/deposit.model.js");
  const deposit = await DepositModel.findById(depositId).lean();

  if (!deposit) {
    return res.status(404).json(
      new ApiResponse({ success: false, message: "Deposit not found" }),
    );
  }

  const result = await distributeDepositIncome({
    userId: deposit.userRef,
    depositId,
  });

  res.json(new ApiResponse({ message: "Income distribution completed", data: result }));
});

// ─── Admin: Income Logs ──────────────────────────────────────────────────────

export const getIncomeLogsController = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const type = req.query.type || null;

  const data = await getAllIncomeLogs({ page, limit, type });
  res.json(new ApiResponse({ message: "Income logs fetched", data }));
});

// ─── Admin: User Income Logs ─────────────────────────────────────────────────

export const getUserIncomeLogsController = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;

  const data = await getUserIncomeLogs(userId, { page, limit });
  res.json(new ApiResponse({ message: "User income logs fetched", data }));
});

// ─── Admin: Funds Summary ────────────────────────────────────────────────────

export const getFundsSummaryController = asyncHandler(async (_req, res) => {
  const data = await getFundsSummary();
  res.json(new ApiResponse({ message: "Funds summary fetched", data }));
});

// ─── Admin: Fund Transactions ────────────────────────────────────────────────

export const getFundTransactionsController = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const fundType = req.query.fundType || null;
  const dateFrom = req.query.dateFrom || null;
  const dateTo = req.query.dateTo || null;
  const userId = req.query.userId || null;
  const depositId = req.query.depositId || null;

  const data = await getFundTransactions({ page, limit, fundType, dateFrom, dateTo, userId, depositId });
  res.json(new ApiResponse({ message: "Fund transactions fetched", data }));
});

// ─── Admin: Deposit Distribution Detail ──────────────────────────────────────

export const getDepositDistributionController = asyncHandler(async (req, res) => {
  const { depositId } = req.params;
  const data = await getDistributionByDeposit(depositId);
  res.json(new ApiResponse({ message: "Deposit distribution fetched", data }));
});

// ─── Admin: Users with Rebirths ──────────────────────────────────────────────

export const getAdminUsersWithRebirthsController = asyncHandler(async (req, res) => {
  const search = req.query.search || "";
  const status = req.query.status || "";
  const type = req.query.type || "all";

  const data = await getAdminUsersWithRebirths({ search, status, type });
  res.json(new ApiResponse({
    message: "Users with rebirths fetched",
    data: { users: data, count: data.length },
  }));
});

// ─── Admin: User Income Summary ──────────────────────────────────────────────

export const getUserIncomeSummaryController = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const data = await getUserIncomeSummary(userId);
  res.json(new ApiResponse({ message: "User income summary fetched", data }));
});

// ─── User: My Wallet ─────────────────────────────────────────────────────────

export const getMyWalletController = asyncHandler(async (req, res) => {
  const data = await getUserWallet(req.auth.sub);
  res.json(new ApiResponse({ message: "Wallet data fetched", data }));
});

// ─── User: My Income Logs ────────────────────────────────────────────────────

export const getMyIncomeLogsController = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;

  const data = await getUserIncomeLogs(req.auth.sub, { page, limit });
  res.json(new ApiResponse({ message: "My income logs fetched", data }));
});

// ─── User: My Rebirth IDs ────────────────────────────────────────────────────

export const getMyRebirthIdsController = asyncHandler(async (req, res) => {
  const data = await getUserRebirthIds(req.auth.sub);
  res.json(new ApiResponse({ message: "Rebirth IDs fetched", data }));
});
