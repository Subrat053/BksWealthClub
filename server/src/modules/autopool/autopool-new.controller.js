import { ApiResponse } from "../../core/ApiResponse.js";
import { asyncHandler } from "../../core/asyncHandler.js";
import { AutoPoolEntry } from "./autopool-entry.model.js";
import { AutoPoolQueue } from "./autopool-queue.model.js";
import { RebirthId } from "./rebirth.model.js";
import { AutopoolMatrix } from "./autopool-matrix.model.js";

export const getQueue = asyncHandler(async (req, res) => {
  // Support both legacy (nodeId) and new (rebirthNodeId) queue documents.
  // Only populate `nodeId` when the schema defines it to avoid strictPopulate errors.
    const queue = await AutoPoolQueue.find({ processed: false })
      .sort({ queuePosition: 1 })
      .populate({
        path: "rebirthNodeId",
        populate: [{ path: "ownerUserId", select: "fullName memberId" }],
      })
      .lean();

    const data = queue
      .map((item) => {
        const node = item.rebirthNodeId;
        if (!node) return null;
        return {
          ...node,
          queueId: item._id,
          queueStatus: item.processed ? "PROCESSED" : "WAITING",
          queuePosition: item.queuePosition,
          queueTimestamp: item.createdAt,
        };
      })
      .filter(Boolean);

    res.json(new ApiResponse({ message: "Queue fetched", data }));
});

export const getTree = asyncHandler(async (req, res) => {
  // Return the autopool matrix view instead of legacy AutoPoolEntry
  const nodes = await AutopoolMatrix.find({})
    .populate({
      path: "linkedRebirthNodeId",
      populate: { path: "ownerUserId", select: "fullName memberId" },
    })
    .populate("parentPoolNodeId", "poolNodeId")
    .sort({ createdAt: 1 })
    .lean();

  res.json(new ApiResponse({ message: "Tree fetched", data: nodes }));
});

export const getStats = asyncHandler(async (req, res) => {
  const [
    totalMatrixNodes,
    placedNodes,
    completedNodes,
    totalRebirths,
    queueWaiting,
    queueProcessing,
  ] = await Promise.all([
    AutopoolMatrix.countDocuments(),
    AutopoolMatrix.countDocuments({ status: "PLACED" }),
    AutopoolMatrix.countDocuments({ status: "COMPLETED" }),
    RebirthId.countDocuments(),
    AutoPoolQueue.countDocuments({ processed: false }),
    AutoPoolQueue.countDocuments({ processingLockId: { $ne: null } }),
  ]);

  res.json(
    new ApiResponse({
      message: "Stats fetched",
      data: {
        totalEntries: totalMatrixNodes,
        pendingEntries: totalMatrixNodes - placedNodes,
        placedEntries: placedNodes,
        completedEntries: completedNodes,
        totalRebirths,
        queueWaiting,
        queueProcessing,
      },
    }),
  );
});

export const getUserDetail = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const [entries, rebirths] = await Promise.all([
    AutoPoolEntry.find({ ownerUserId: userId, sourceType: "REBIRTH" }).sort({
      createdAt: -1,
    }),
    RebirthId.find({ ownerUserId: userId }).sort({ createdAt: -1 }),
  ]);

  res.json(
    new ApiResponse({
      message: "User autopool detail fetched",
      data: { entries, rebirths },
    }),
  );
});

export const getMyAutoPool = asyncHandler(async (req, res) => {
  const userId = req.auth.sub;
  const [entries, rebirths] = await Promise.all([
    AutoPoolEntry.find({ ownerUserId: userId, sourceType: "REBIRTH" })
      .populate("matrixParentEntryId", "displayId")
      .sort({ createdAt: -1 }),
    RebirthId.find({ ownerUserId: userId }).sort({ createdAt: -1 }),
  ]);

  res.json(
    new ApiResponse({
      message: "My autopool fetched",
      data: { entries, rebirths },
    }),
  );
});

export const getNodeById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const node = await AutoPoolEntry.findById(id)
    .populate("ownerUserId", "fullName memberId")
    .populate("matrixParentEntryId", "displayId")
    .populate("childrenEntryIds", "displayId status ownerUserId")
    .lean();

  if (!node) {
    res.status(404).json(new ApiResponse({ message: "Node not found" }));
    return;
  }

  res.json(new ApiResponse({ message: "Node fetched", data: node }));
});

export const processQueue = asyncHandler(async (req, res) => {
  const { autoPoolNewService } = await import("./autopool-new.service.js");
  // Trigger processing
  await autoPoolNewService.processAutoPoolQueue();
  res.json(new ApiResponse({ message: "Queue processing triggered" }));
});
