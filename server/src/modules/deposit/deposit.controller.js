import { ApiResponse } from "../../core/ApiResponse.js";
import { asyncHandler } from "../../core/asyncHandler.js";
import { depositService } from "./deposit.service.js";

export const createDepositController = asyncHandler(async (req, res) => {
  const data = await depositService.createRequest({ userId: req.auth.sub, payload: req.body });
  res.status(201).json(new ApiResponse({ message: "Deposit request created", data }));
});

export const getMyDepositsController = asyncHandler(async (req, res) => {
  const data = await depositService.getMyHistory(req.auth.sub);
  res.json(new ApiResponse({ message: "Deposit history fetched", data }));
});

export const getPendingDepositsController = asyncHandler(async (_req, res) => {
  const data = await depositService.getPendingRequests();
  res.json(new ApiResponse({ message: "Pending deposits fetched", data }));
});

export const approveDepositController = asyncHandler(async (req, res) => {
  const data = await depositService.approveRequest({ depositId: req.params.id, adminId: req.auth.sub });
  res.json(new ApiResponse({ message: "Deposit approved", data }));
});

export const rejectDepositController = asyncHandler(async (req, res) => {
  const data = await depositService.rejectRequest({
    depositId: req.params.id,
    adminId: req.auth.sub,
    reason: req.body.reason,
  });
  res.json(new ApiResponse({ message: "Deposit rejected", data }));
});
