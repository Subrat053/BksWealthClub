import { ApiResponse } from "../../core/ApiResponse.js";
import { asyncHandler } from "../../core/asyncHandler.js";
import { withdrawalService } from "./withdrawal.service.js";

export const createWithdrawalController = asyncHandler(async (req, res) => {
  const data = await withdrawalService.createRequest({ userId: req.auth.sub, payload: req.body });
  res.status(201).json(new ApiResponse({ message: "Withdrawal request submitted", data }));
});

export const getWithdrawalHistoryController = asyncHandler(async (req, res) => {
  const data = await withdrawalService.getMyHistory(req.auth.sub);
  res.json(new ApiResponse({ message: "Withdrawal history fetched", data }));
});

export const getPendingWithdrawalController = asyncHandler(async (_req, res) => {
  const data = await withdrawalService.getPending();
  res.json(new ApiResponse({ message: "Pending withdrawals fetched", data }));
});

export const approveWithdrawalController = asyncHandler(async (req, res) => {
  const data = await withdrawalService.approve({ withdrawalId: req.params.id, adminId: req.auth.sub });
  res.json(new ApiResponse({ message: "Withdrawal approved", data }));
});

export const rejectWithdrawalController = asyncHandler(async (req, res) => {
  const data = await withdrawalService.reject({
    withdrawalId: req.params.id,
    adminId: req.auth.sub,
    reason: req.body.reason,
  });
  res.json(new ApiResponse({ message: "Withdrawal rejected", data }));
});
