import { ApiResponse } from "../../core/ApiResponse.js";
import { asyncHandler } from "../../core/asyncHandler.js";
import { autopoolService } from "./autopool.service.js";

export const getAutopoolQueueController = asyncHandler(async (_req, res) => {
  // DEPRECATED: Use new 3x3 system endpoints
  res.json(new ApiResponse({ 
    message: "Use /api/v1/autopool/3x3/admin/queue instead",
    deprecated: true,
    data: { pending: 0, placed: 0, completed: 0 }
  }));
});

export const processAutopoolQueueController = asyncHandler(async (_req, res) => {
  // DEPRECATED: Queue processing is automatic with new 3x3 system
  res.json(new ApiResponse({ 
    message: "Automatic queue processing is handled by new 3x3 system. Use /api/v1/autopool/3x3/admin/process-queue for manual processing.",
    deprecated: true,
    processed: 0
  }));
});

export const getAutopoolMatrixController = asyncHandler(async (_req, res) => {
  // DEPRECATED: Use new 3x3 system endpoints
  res.json(new ApiResponse({ 
    message: "Use /api/v1/autopool/3x3/admin/tree instead",
    deprecated: true,
    data: []
  }));
});

export const getAutopoolNodeController = asyncHandler(async (req, res) => {
  const node = await autopoolService.getAutopoolNode(req.params.id);
  if (!node) {
    res.status(404).json(new ApiResponse({ message: "Node not found" }));
    return;
  }
  res.json(new ApiResponse({ message: "Autopool node fetched", data: node }));
});

export const getMyRebirthTreeController = asyncHandler(async (req, res) => {
  const data = await autopoolService.getRebirthTreeByUser(req.auth.sub);
  res.json(new ApiResponse({ message: "Rebirth tree fetched", data }));
});

export const getRebirthTreeByUserController = asyncHandler(async (req, res) => {
  const data = await autopoolService.getRebirthTreeByUser(req.params.userId);
  res.json(new ApiResponse({ message: "Rebirth tree fetched", data }));
});
