import { ApiResponse } from "../../core/ApiResponse.js";
import { asyncHandler } from "../../core/asyncHandler.js";
import { dashboardService } from "./dashboard.service.js";

export const getMemberDashboardController = asyncHandler(async (req, res) => {
  const data = await dashboardService.getMemberSummary({ user: req.auth || {} });
  res.json(new ApiResponse({ message: "Member dashboard summary fetched", data }));
});

export const getAdminDashboardController = asyncHandler(async (_req, res) => {
  const data = await dashboardService.getAdminSummary();
  res.json(new ApiResponse({ message: "Admin dashboard summary fetched", data }));
});
