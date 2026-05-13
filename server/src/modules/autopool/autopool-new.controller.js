import { ApiResponse } from "../../core/ApiResponse.js";
import { asyncHandler } from "../../core/asyncHandler.js";
import { RebirthId } from "./rebirth.model.js";
import { AutoPoolNode, AutopoolMatrix } from "./autopool-matrix.model.js";

export const getQueue = asyncHandler(async (req, res) => {
  // Return all nodes for visibility in the admin queue table
  const pendingNodes = await AutopoolMatrix.find({})
    .sort({ queueTimestamp: 1 })
    .populate("ownerUserId", "fullName memberId")
    .populate("matrixParentId", "nodeCode")
    .lean();

  const data = pendingNodes.map((node) => {
    const generation = node.nodeCode.includes('-R') ? node.nodeCode.split('-R').length - 1 : 0;
    return {
      ...node,
      _id: node._id,
      displayId: node.nodeCode,
      poolNodeId: node.nodeCode,
      rebirthCode: node.nodeCode,
      sourceType: node.nodeType,
      queueTimestamp: node.queueTimestamp,
      ownerDetails: node.ownerUserId,
      ownerUserId: node.ownerUserId, // For legacy admin table
      status: node.status,
      generation,
      parentPoolNodeId: node.matrixParentId ? { ...node.matrixParentId, poolNodeId: node.matrixParentId.nodeCode } : null,
      rebirthChildrenCount: node.directChildrenCount,
      autopoolChildrenCount: node.directChildrenCount
    };
  });

  res.json(new ApiResponse({ message: "Queue fetched", data }));
});

export const getTree = asyncHandler(async (req, res) => {
  // Return the full 3x3 matrix tree
  // Using explicit population to avoid any StrictPopulate issues with old fields
  const nodes = await AutopoolMatrix.find({})
    .populate({
      path: "ownerUserId",
      select: "fullName memberId"
    })
    .populate({
      path: "matrixParentId",
      select: "nodeCode"
    })
    .sort({ createdAt: 1 })
    .lean();

  const data = nodes.map(node => {
    const generation = node.nodeCode.includes('-R') ? node.nodeCode.split('-R').length - 1 : 0;
    return {
      ...node,
      displayId: node.nodeCode || "N/A",
      poolNodeId: node.nodeCode,
      parentPoolNodeId: node.matrixParentId ? { ...node.matrixParentId, poolNodeId: node.matrixParentId.nodeCode } : null,
      parentDisplayId: node.matrixParentId?.nodeCode || null,
      ownerDetails: node.ownerUserId,
      linkedRebirthNodeId: { ownerUserId: node.ownerUserId }, // Alias for tree owner display
      sourceType: node.nodeType,
      autopoolChildrenCount: node.directChildrenCount,
      generation
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
    AutopoolMatrix.countDocuments(),
    AutopoolMatrix.countDocuments({ status: "PLACED" }),
    AutopoolMatrix.countDocuments({ status: "COMPLETED" }),
    RebirthId.countDocuments(),
    AutopoolMatrix.countDocuments({ status: "PENDING" }),
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
        queueProcessing: 0, // No lock mechanism in new simplified system
      },
    }),
  );
});

export const getUserDetail = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const [entries, rebirths] = await Promise.all([
    AutoPoolNode.find({ ownerUserId: userId, nodeType: "REBIRTH" }).sort({
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
  const [nodes, rebirths] = await Promise.all([
    AutopoolMatrix.find({ ownerUserId: userId })
      .populate("matrixParentId", "nodeCode")
      .sort({ createdAt: -1 })
      .lean(),
    RebirthId.find({ ownerUserId: userId }).sort({ createdAt: -1 }).lean(),
  ]);

  // Map nodes to match frontend expectations in AutopoolTreePage.jsx
  const entries = nodes.map(node => ({
    _id: node._id,
    displayId: node.nodeCode,
    status: node.status,
    queueTimestamp: node.queueTimestamp,
    sourceType: node.nodeType,
    directChildrenCount: node.directChildrenCount,
    // Extract level from R count if present, e.g. BKS-R1 -> 1
    rebirthLevel: node.nodeCode.includes('-R') ? parseInt(node.nodeCode.split('-R')[1]) : 0,
    matrixParentEntryId: node.matrixParentId ? { displayId: node.matrixParentId.nodeCode } : null
  }));

  res.json(
    new ApiResponse({
      message: "My autopool fetched",
      data: { entries, rebirths },
    }),
  );
});

export const getNodeById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const node = await AutoPoolNode.findById(id)
    .populate("ownerUserId", "fullName memberId")
    .populate("matrixParentId", "nodeCode")
    .populate("parentNodeId", "nodeCode")
    .populate("directChildren", "nodeCode status ownerUserId")
    .lean();

  if (!node) {
    res.status(404).json(new ApiResponse({ message: "Node not found" }));
    return;
  }

  res.json(new ApiResponse({ message: "Node fetched", data: node }));
});

export const processQueue = asyncHandler(async (req, res) => {
  const { default: autopool3x3Service } = await import("./autopool-3x3.service.js");
  // Trigger processing
  await autopool3x3Service.processAutoPoolQueue();
  res.json(new ApiResponse({ message: "Queue processing triggered" }));
});
