import { ApiResponse } from "../../core/ApiResponse.js";
import { asyncHandler } from "../../core/asyncHandler.js";
import { AutoPoolEntry } from "./autopool-entry.model.js";
import { RebirthId } from "./rebirth.model.js";
import { User } from "../user/user.model.js";

export const getQueue = asyncHandler(async (req, res) => {
  const entries = await AutoPoolEntry.find()
    .populate("ownerUserId", "fullName memberId")
    .populate("matrixParentEntryId", "displayId")
    .sort({ queueTimestamp: 1 });
  
  res.json(new ApiResponse({ message: "Queue fetched", data: entries }));
});

export const getTree = asyncHandler(async (req, res) => {
  const nodes = await AutoPoolEntry.find({ status: { $ne: "PENDING" } })
    .populate("ownerUserId", "fullName memberId")
    .lean();
  
  res.json(new ApiResponse({ message: "Tree fetched", data: nodes }));
});

export const getStats = asyncHandler(async (req, res) => {
  const [totalEntries, pendingEntries, placedEntries, completedEntries, totalRebirths] = await Promise.all([
    AutoPoolEntry.countDocuments(),
    AutoPoolEntry.countDocuments({ status: "PENDING" }),
    AutoPoolEntry.countDocuments({ status: "PLACED" }),
    AutoPoolEntry.countDocuments({ status: "COMPLETED" }),
    RebirthId.countDocuments(),
  ]);

  res.json(new ApiResponse({ 
    message: "Stats fetched", 
    data: { totalEntries, pendingEntries, placedEntries, completedEntries, totalRebirths } 
  }));
});

export const getUserDetail = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const [entries, rebirths] = await Promise.all([
    AutoPoolEntry.find({ ownerUserId: userId }).sort({ createdAt: -1 }),
    RebirthId.find({ ownerUserId: userId }).sort({ createdAt: -1 }),
  ]);
  
  res.json(new ApiResponse({ message: "User autopool detail fetched", data: { entries, rebirths } }));
});

export const getMyAutoPool = asyncHandler(async (req, res) => {
  const userId = req.auth.sub;
  const [entries, rebirths] = await Promise.all([
    AutoPoolEntry.find({ ownerUserId: userId })
      .populate("matrixParentEntryId", "displayId")
      .sort({ createdAt: -1 }),
    RebirthId.find({ ownerUserId: userId }).sort({ createdAt: -1 }),
  ]);
  
  res.json(new ApiResponse({ message: "My autopool fetched", data: { entries, rebirths } }));
});

export const processQueue = asyncHandler(async (req, res) => {
  const { autoPoolNewService } = await import("./autopool-new.service.js");
  // Trigger processing
  await autoPoolNewService.processAutoPoolQueue();
  res.json(new ApiResponse({ message: "Queue processing triggered" }));
});
