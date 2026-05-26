import { ApiResponse } from "../../core/ApiResponse.js";
import { asyncHandler } from "../../core/asyncHandler.js";
import { walletService } from "./wallet.service.js";

const getAuthUserId = (req) =>
  req.auth?.userId || req.auth?.sub || req.auth?.adminId;

export const getWalletSummaryController = asyncHandler(async (req, res) => {
  const data = await walletService.getSummary(getAuthUserId(req));
  res.json(new ApiResponse({ message: "Wallet summary fetched successfully", data }));
});

export const getWalletLedgerController = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const data = await walletService.getLedger(getAuthUserId(req), { page, limit });
  res.json(new ApiResponse({ message: "Wallet ledger fetched successfully", data }));
});

export const createWithdrawRequestController = asyncHandler(async (req, res) => {
  const { amount, walletAddress, network, userNote } = req.body;
  const data = await walletService.createWithdrawalRequest({
    userId: getAuthUserId(req),
    requestedAmount: Number(amount),
    walletAddress,
    network,
    userNote,
  });
  res.status(201).json(new ApiResponse({ message: "Withdrawal request submitted successfully", data }));
});

export const createWalletTransferController = asyncHandler(async (req, res) => {
  const { receiverMemberId, amount, note } = req.body;
  const data = await walletService.walletTransfer({
    senderUserId: getAuthUserId(req),
    receiverMemberId,
    amount: Number(amount),
    note,
  });
  res.status(201).json(new ApiResponse({ message: "Wallet transfer completed successfully", data }));
});

export const getWithdrawHistoryController = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const data = await walletService.getWithdrawalHistory(getAuthUserId(req), { page, limit });
  res.json(new ApiResponse({ message: "Withdrawal history fetched successfully", data }));
});

export const getTransferHistoryController = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const data = await walletService.getTransferHistory(getAuthUserId(req), { page, limit });
  res.json(new ApiResponse({ message: "Wallet transfer history fetched successfully", data }));
});

// ─── ADMIN CONTROLLERS ──────────────────────────────────────────────────────

export const getAdminWithdrawalsController = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const { status, userId, search } = req.query;
  const data = await walletService.getAdminWithdrawals({ page, limit, status, userId, search });
  res.json(new ApiResponse({ message: "Withdrawals fetched successfully", data }));
});

export const approveAdminWithdrawalController = asyncHandler(async (req, res) => {
  const data = await walletService.approveWithdrawalRequest({
    withdrawalId: req.params.id,
    adminId: getAuthUserId(req),
  });
  res.json(new ApiResponse({ message: "Withdrawal request approved", data }));
});

export const rejectAdminWithdrawalController = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const data = await walletService.rejectWithdrawalRequest({
    withdrawalId: req.params.id,
    adminId: getAuthUserId(req),
    reason,
  });
  res.json(new ApiResponse({ message: "Withdrawal request rejected successfully", data }));
});

export const markPaidAdminWithdrawalController = asyncHandler(async (req, res) => {
  const { txHash, adminNote, withdrawalId, id } = req.body;
  const data = await walletService.markPaidWithdrawalRequest({
    withdrawalId: req.params.id || withdrawalId || id,
    adminId: getAuthUserId(req),
    txHash,
    adminNote,
  });
  res.json(new ApiResponse({ message: "Withdrawal request marked as PAID successfully", data }));
});

export const getAdminWalletTransfersController = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const { search } = req.query;
  const data = await walletService.getAdminWalletTransfers({ page, limit, search });
  res.json(new ApiResponse({ message: "Internal wallet transfers fetched successfully", data }));
});
