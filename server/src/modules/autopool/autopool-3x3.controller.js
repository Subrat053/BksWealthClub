/**
 * AutoPool 3x3 Controller
 *
 * Handles all API endpoints for 3x3 Matrix AutoPool
 */

import { asyncHandler } from "../../core/asyncHandler.js";
import { ApiError } from "../../core/ApiError.js";
import { ApiResponse } from "../../core/ApiResponse.js";
import autopool3x3Service from "./autopool-3x3.service.js";

// ─── Admin Routes ────────────────────────────────────────────────────────────

/**
 * GET /api/v1/autopool/admin/tree
 * Get complete AutoPool tree
 */
export const getAutoPoolTree = asyncHandler(async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : 100;
  const nodes = await autopool3x3Service.getAutoPoolTree(limit);

  const mappedNodes = nodes.map((node) => {
    const leanNode = node.toObject ? node.toObject() : node;
    return {
      ...leanNode,
      poolNodeId: leanNode.nodeCode,
      parentPoolNodeId: leanNode.matrixParentId
        ? {
            ...leanNode.matrixParentId,
            poolNodeId: leanNode.matrixParentId.nodeCode,
          }
        : null,
      linkedRebirthNodeId: {
        ownerUserId: leanNode.ownerUserId || {
          fullName: "Operational Admin",
          memberId: leanNode.nodeCode,
        },
      },
      autopoolChildrenCount: leanNode.directChildrenCount || 0,
    };
  });

  res.json(
    new ApiResponse({
      message: "AutoPool tree fetched",
      data: mappedNodes,
    }),
  );
});

export const getQueueNodes = asyncHandler(async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : 100;
  const page = req.query.page ? parseInt(req.query.page) : 1;
  const search = req.query.search || "";
  const { nodes, total } = await autopool3x3Service.getQueueNodes(limit, page, true, search);

  const mappedNodes = nodes.map((node) => {
    const leanNode = node.toObject ? node.toObject() : node;
    return {
      ...leanNode,
      rebirthCode: leanNode.nodeCode,
      generation: leanNode.levelNumber || 0,
      parentPoolNodeId: leanNode.matrixParentId
        ? { poolNodeId: leanNode.matrixParentId.nodeCode }
        : null,
      rebirthChildrenCount: leanNode.directChildrenCount || 0,
    };
  });

  res.json(
    new ApiResponse({
      message: "Queue nodes fetched",
      data: mappedNodes,
      meta: {
        total,
        page,
        limit,
        totalPages: limit > 0 ? Math.ceil(total / limit) : 1,
      }
    }),
  );
});

/**
 * GET /api/v1/autopool/admin/stats
 * Get queue status/counts
 */
export const getQueueStatus = asyncHandler(async (req, res) => {
  const status = await autopool3x3Service.getQueueStatus();

  res.json(
    new ApiResponse({
      message: "Queue status fetched",
      data: status,
    }),
  );
});

/**
 * GET /api/v1/autopool/admin/completed
 * Get completed nodes
 */
export const getCompletedNodes = asyncHandler(async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : 100;
  const nodes = await autopool3x3Service.getCompletedNodes(limit);

  res.json(
    new ApiResponse({
      message: "Completed nodes fetched",
      data: nodes,
    }),
  );
});

/**
 * GET /api/v1/autopool/admin/user/:userId
 * Get user's AutoPool details
 */
export const getUserAutoPoolDetails = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const details = await autopool3x3Service.getUserAutoPoolDetails(userId);

  if (!details.user) {
    throw new ApiError(404, "User not found");
  }

  res.json(
    new ApiResponse({
      message: "User autopool details fetched",
      data: {
        user: details.user,
        autoPoolNodes: {
          count: details.nodes.length,
          nodes: details.nodes,
        },
        rebirthIds: {
          count: details.rebirths.length,
          rebirths: details.rebirths,
        },
      },
    }),
  );
});

/**
 * POST /api/v1/autopool/admin/process-queue
 * Manually process AutoPool queue
 */
export const processQueueManually = asyncHandler(async (req, res) => {
  const result = await autopool3x3Service.processAutoPoolQueue();

  res.json(
    new ApiResponse({
      message: `Processed ${result.placedCount} nodes. ${result.completed ? "Queue completed." : "More nodes to process."}`,
      data: result,
    }),
  );
});

/**
 * GET /api/v1/autopool/3x3/operational-admin/my-tree
 * Get authenticated operational admin's scoped AutoPool tree
 */
export const getOperationalAdminMyTree = asyncHandler(async (req, res) => {
  const data = await autopool3x3Service.getOperationalAdminMyTree(
    req.auth || {},
  );

  if (!data) {
    throw new ApiError(403, "Operational admin access only.");
  }

  res.json(
    new ApiResponse({
      message: "Operational admin autopool tree fetched",
      data,
    }),
  );
});

// ─── User Routes ────────────────────────────────────────────────────────────

/**
 * GET /api/v1/autopool/my
 * Get user's AutoPool nodes
 */
export const getMyAutoPoolNodes = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const nodes = await autopool3x3Service.getUserAutoPoolTree(userId);

  const mappedNodes = nodes.map((node) => {
    const leanNode = node.toObject ? node.toObject() : node;
    return {
      ...leanNode,
      displayId: leanNode.nodeCode,
      poolNodeId: leanNode.nodeCode,
      parentPoolNodeId: leanNode.matrixParentId
        ? { poolNodeId: leanNode.matrixParentId.nodeCode }
        : null,
      linkedRebirthNodeId: {
        ownerUserId: {
          fullName: req.user.fullName,
          memberId: req.user.memberId,
        },
      },
      autopoolChildrenCount: leanNode.directChildrenCount || 0,
    };
  });

  // Fetch completions separately
  const rebirths = await autopool3x3Service.getUserRebirths(userId);
  const completions = rebirths.map((r) => ({
    _id: r._id,
    autoPoolNumber: r.levelNumber + 1,
    completedNodeCount:
      nodes.find((n) => n.nodeCode === r.displayCode)?.directChildrenCount || 0,
    expectedNodeCount: 3,
    isCompleted:
      nodes.find((n) => n.nodeCode === r.displayCode)?.status === "COMPLETED",
    completedAt: nodes.find((n) => n.nodeCode === r.displayCode)?.completedAt,
  }));

  res.json(
    new ApiResponse({
      message: "My autopool nodes fetched",
      data: {
        nodes: mappedNodes,
        completions,
      },
    }),
  );
});

/**
 * GET /api/v1/autopool/my-rebirths
 * Get user's rebirth IDs
 */
export const getMyRebirths = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const rebirths = await autopool3x3Service.getUserRebirths(userId);

  res.json(
    new ApiResponse({
      message: "My rebirths fetched",
      data: rebirths,
    }),
  );
});

/**
 * GET /api/v1/autopool/my/summary
 * Get user's AutoPool summary
 */
export const getMyAutoPoolSummary = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const nodes = await autopool3x3Service.getUserAutoPoolTree(userId);
  const rebirths = await autopool3x3Service.getUserRebirths(userId);

  const pendingCount = nodes.filter((n) => n.status === "PENDING").length;
  const placedCount = nodes.filter((n) => n.status === "PLACED").length;
  const completedCount = nodes.filter((n) => n.status === "COMPLETED").length;

  res.json(
    new ApiResponse({
      message: "My autopool summary fetched",
      data: {
        stats: {
          totalNodes: nodes.length,
          pending: pendingCount,
          placed: placedCount,
          completed: completedCount,
        },
        rebirths: {
          count: rebirths.length,
          rebirths,
        },
        nodes: nodes.map((n) => ({
          nodeCode: n.nodeCode,
          nodeType: n.nodeType,
          status: n.status,
          childrenCount: n.directChildrenCount,
          createdAt: n.createdAt,
          completedAt: n.completedAt,
        })),
      },
    }),
  );
});

export default {
  getAutoPoolTree,
  getQueueNodes,
  getQueueStatus,
  getCompletedNodes,
  getOperationalAdminMyTree,
  getUserAutoPoolDetails,
  processQueueManually,
  getMyAutoPoolNodes,
  getMyRebirths,
  getMyAutoPoolSummary,
};
