import { ApiResponse } from "../../core/ApiResponse.js";
import { asyncHandler } from "../../core/asyncHandler.js";
import { adminService } from "./admin.service.js";

export const getAdminSummaryController = asyncHandler(async (_req, res) => {
  const data = await adminService.getSummary();
  res.json(new ApiResponse({ message: "Admin summary fetched", data }));
});

export const getUsersController = asyncHandler(async (_req, res) => {
  const data = await adminService.listUsers();
  res.json(new ApiResponse({ message: "Users fetched", data }));
});

export const updateUserStatusController = asyncHandler(async (req, res) => {
  const data = await adminService.updateUserStatus({
    actorRef: req.user.sub,
    userId: req.params.id,
    status: req.body.status,
    meta: {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"] || "",
    },
  });

  res.json(new ApiResponse({ message: "User status updated", data }));
});
