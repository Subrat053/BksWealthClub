import { ApiResponse } from "../../core/ApiResponse.js";
import { asyncHandler } from "../../core/asyncHandler.js";
import { AutoPoolEntry } from "./autopool-entry.model.js";
import { AutoPoolQueue } from "./autopool-queue.model.js";
import { RebirthId } from "./rebirth.model.js";

export const getQueue = asyncHandler(async (req, res) => {
  const queue = await AutoPoolQueue.find({ status: { $ne: "PLACED" } })
    .sort({ queuePosition: 1 })
    .populate({
      path: "nodeId",
      match: { sourceType: "REBIRTH" },
      populate: [
        { path: "ownerUserId", select: "fullName memberId" },
        { path: "matrixParentEntryId", select: "displayId" },
      ],
    })
    .lean();

  const filtered = queue.filter((item) => item.nodeId);
  const data = filtered.map((item) => ({
    ...item.nodeId,
    queueId: item._id,
    queueStatus: item.status,
    queuePosition: item.queuePosition,
    queueTimestamp: item.queueTimestamp,
  }));

  res.json(new ApiResponse({ message: "Queue fetched", data }));
});

export const getTree = asyncHandler(async (req, res) => {
  const nodes = await AutoPoolEntry.find({
    status: { $ne: "PENDING" },
    sourceType: "REBIRTH",
  })
    .populate("ownerUserId", "fullName memberId")
    .populate("matrixParentEntryId", "displayId")
    .sort({ placedAt: 1, queueTimestamp: 1 })
    .lean();

  res.json(new ApiResponse({ message: "Tree fetched", data: nodes }));
});

export const getStats = asyncHandler(async (req, res) => {
  const [
    totalEntries,
    pendingEntries,
    placedEntries,
    completedEntries,
    totalRebirths,
    queueWaiting,
    queueProcessing,
  ] = await Promise.all([
    AutoPoolEntry.countDocuments(),
    AutoPoolEntry.countDocuments({ status: "PENDING" }),
    AutoPoolEntry.countDocuments({ status: "PLACED" }),
    AutoPoolEntry.countDocuments({ status: "COMPLETED" }),
    RebirthId.countDocuments(),
    AutoPoolQueue.countDocuments({ status: "WAITING" }),
    AutoPoolQueue.countDocuments({ status: "PROCESSING" }),
  ]);

  res.json(
    new ApiResponse({
      message: "Stats fetched",
      data: {
        totalEntries,
        pendingEntries,
        placedEntries,
        completedEntries,
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
