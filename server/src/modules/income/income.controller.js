import { ApiResponse } from "../../core/ApiResponse.js";
import { asyncHandler } from "../../core/asyncHandler.js";
import { incomeService } from "./income.service.js";

export const getIncomeSummaryController = asyncHandler(async (req, res) => {
  const data = await incomeService.getSummary(req.user.sub);
  res.json(new ApiResponse({ message: "Income summary fetched", data }));
});

export const getIncomeHistoryController = asyncHandler(async (req, res) => {
  const data = await incomeService.getHistory(req.user.sub, req.query);
  res.json(new ApiResponse({ message: "Income history fetched", data }));
});
