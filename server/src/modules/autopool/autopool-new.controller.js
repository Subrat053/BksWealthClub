import { ApiResponse } from "../../core/ApiResponse.js";
import { asyncHandler } from "../../core/asyncHandler.js";
import { RebirthId } from "./rebirth.model.js";
import { AutoPoolNode, AutopoolMatrix } from "./autopool-matrix.model.js";
import { AutoPoolLevelCompletion } from "./autopool-level-completion.model.js";

export const getQueue = asyncHandler(async (req, res) => {
  // Return ONLY rebirth nodes for the queue
  const pendingNodes = await AutopoolMatrix.find({ 
    nodeType: "REBIRTH" 
  })
    .sort({ queueTimestamp: 1 })
    .populate("ownerUserId", "fullName memberId")
    .populate("matrixParentId", "nodeCode displayCode")
    .lean();

  const data = pendingNodes.map((node) => {
    return {
      ...node,
      rebirthCode: node.nodeCode || node.displayCode,
      generation: node.levelNumber ?? 0,
      displayId: node.displayCode || node.nodeCode,
      poolNodeId: node.displayCode || node.nodeCode,
      ownerDetails: node.ownerUserId,
      queueTimestamp: node.queueTimestamp || node.createdAt,
      parentPoolNodeId: node.matrixParentId 
        ? { poolNodeId: node.matrixParentId.displayCode || node.matrixParentId.nodeCode } 
        : null,
      rebirthChildrenCount: node.directChildrenCount || 0,
    };
  });

  res.json(new ApiResponse({ message: "Queue fetched", data }));
});

export const getTree = asyncHandler(async (req, res) => {
  // Show only rebirth IDs and the admin root
  const nodes = await AutopoolMatrix.find({
    $or: [
      { nodeType: "REBIRTH" },
      { nodeCode: "BKS000000" }
    ]
  })
    .populate({
      path: "ownerUserId",
      select: "fullName memberId"
    })
    .populate({
      path: "matrixParentId",
      select: "nodeCode displayCode"
    })
    .sort({ createdAt: 1 })
    .lean();

  const data = nodes.map((node) => {
    return {
      ...node,
      displayId: node.displayCode || node.nodeCode || "N/A",
      poolNodeId: node.displayCode || node.nodeCode,
      parentPoolNodeId: node.matrixParentId ? { ...node.matrixParentId, poolNodeId: node.matrixParentId.displayCode || node.matrixParentId.nodeCode } : null,
      ownerDetails: node.ownerUserId,
      linkedRebirthNodeId: { ownerUserId: node.ownerUserId },
      autopoolChildrenCount: node.directChildrenCount,
    };
  });

  res.json(new ApiResponse({ message: "Tree fetched", data }));
});

export const getStats = asyncHandler(async (req, res) => {
  const [
    totalMatrixNodes,
    placedNodes,
    completedNodes,
    totalRebirths,
    queueWaiting,
  ] = await Promise.all([
    AutopoolMatrix.countDocuments({ nodeType: "REBIRTH" }),
    AutopoolMatrix.countDocuments({ nodeType: "REBIRTH", status: "PLACED" }),
    AutopoolMatrix.countDocuments({ nodeType: "REBIRTH", status: "COMPLETED" }),
    AutopoolMatrix.countDocuments({ nodeType: "REBIRTH" }),
    AutopoolMatrix.countDocuments({ nodeType: "REBIRTH", status: "PENDING" }),
  ]);

  res.json(
    new ApiResponse({
      message: "Stats fetched",
      data: {
        totalEntries: totalMatrixNodes,
        pendingEntries: queueWaiting,
        placedEntries: placedNodes,
        completedEntries: completedNodes,
        totalRebirths,
        queueWaiting,
        queueProcessing: 0,
      },
    }),
  );
});

export const getUserDetail = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const [entries, completions] = await Promise.all([
    AutoPoolNode.find({ ownerUserId: userId, nodeType: "REBIRTH" }).sort({
      levelNumber: 1,
      levelSequence: 1
    }),
    AutoPoolLevelCompletion.find({ ownerUserId: userId }).sort({ levelNumber: 1 }),
  ]);

  res.json(
    new ApiResponse({
      message: "User autopool detail fetched",
      data: { entries, completions },
    }),
  );
});

export const getMyAutoPool = asyncHandler(async (req, res) => {
  const userId = req.auth.sub;
  const [nodes, completions] = await Promise.all([
    AutopoolMatrix.find({ ownerUserId: userId, nodeType: "REBIRTH" })
      .populate("matrixParentId", "nodeCode displayCode")
      .sort({ levelNumber: 1, levelSequence: 1 })
      .lean(),
    AutoPoolLevelCompletion.find({ ownerUserId: userId }).sort({ levelNumber: 1 }).lean(),
  ]);

  const entries = nodes.map(node => ({
    _id: node._id,
    displayId: node.displayCode || node.nodeCode,
    status: node.status,
    queueTimestamp: node.queueTimestamp,
    levelNumber: node.levelNumber,
    levelSequence: node.levelSequence,
    matrixParentEntryId: node.matrixParentId
      ? { displayId: node.matrixParentId.displayCode || node.matrixParentId.nodeCode }
      : null,
  }));

  res.json(
    new ApiResponse({
      message: "My autopool fetched",
      data: { entries, completions },
    }),
  );
});

export const getNodeById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const node = await AutoPoolNode.findById(id)
    .populate("ownerUserId", "fullName memberId")
    .populate("matrixParentId", "nodeCode displayCode")
    .populate("directChildren", "nodeCode displayCode status ownerUserId")
    .lean();

  if (!node) {
    res.status(404).json(new ApiResponse({ message: "Node not found" }));
    return;
  }

  res.json(new ApiResponse({ message: "Node fetched", data: node }));
});

export const processQueue = asyncHandler(async (req, res) => {
  const { default: autopool3x3Service } = await import("./autopool-3x3.service.js");
  await autopool3x3Service.processAutoPoolQueue();
  res.json(new ApiResponse({ message: "Queue processing triggered" }));
});
