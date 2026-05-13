import { ApiResponse } from "../../core/ApiResponse.js";
import { asyncHandler } from "../../core/asyncHandler.js";
import { autopoolService } from "./autopool.service.js";

export const getAutopoolQueueController = asyncHandler(async (_req, res) => {
  const data = await autopoolService.getAutopoolQueue();
  res.json(new ApiResponse({ message: "Autopool queue fetched", data }));
});

export const processAutopoolQueueController = asyncHandler(async (_req, res) => {
  const data = await autopoolService.processAutopoolQueue();
  res.json(new ApiResponse({ message: "Autopool queue processed", data }));
});

export const getAutopoolMatrixController = asyncHandler(async (_req, res) => {
  const data = await autopoolService.getAutopoolMatrix();
  res.json(new ApiResponse({ message: "Autopool matrix fetched", data }));
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
