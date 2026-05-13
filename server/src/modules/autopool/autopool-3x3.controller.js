/**
 * AutoPool 3x3 Controller
 * 
 * Handles all API endpoints for 3x3 Matrix AutoPool
 */

import { asyncHandler } from "../../core/asyncHandler.js";
import { ApiError } from "../../core/ApiError.js";
import autopool3x3Service from "./autopool-3x3.service.js";

// ─── Admin Routes ────────────────────────────────────────────────────────────

/**
 * GET /api/v1/autopool/admin/tree
 * Get complete AutoPool tree
 */
export const getAutoPoolTree = asyncHandler(async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : 100;
  const tree = await autopool3x3Service.getAutoPoolTree(limit);

  res.status(200).json({
    success: true,
    data: {
      nodeCount: tree.length,
      nodes: tree,
    },
  });
});

/**
 * GET /api/v1/autopool/admin/queue
 * Get queue status
 */
export const getQueueStatus = asyncHandler(async (req, res) => {
  const status = await autopool3x3Service.getQueueStatus();

  res.status(200).json({
    success: true,
    data: status,
  });
});

/**
 * GET /api/v1/autopool/admin/completed
 * Get completed nodes
 */
export const getCompletedNodes = asyncHandler(async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : 100;
  const nodes = await autopool3x3Service.getCompletedNodes(limit);

  res.status(200).json({
    success: true,
    data: {
      completedCount: nodes.length,
      nodes,
    },
  });
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

  res.status(200).json({
    success: true,
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
  });
});

/**
 * POST /api/v1/autopool/admin/process-queue
 * Manually process AutoPool queue
 */
export const processQueueManually = asyncHandler(async (req, res) => {
  const result = await autopool3x3Service.processAutoPoolQueue();

  res.status(200).json({
    success: true,
    message: `Processed ${result.placedCount} nodes. ${result.completed ? "Queue completed." : "More nodes to process."}`,
    data: result,
  });
});

// ─── User Routes ────────────────────────────────────────────────────────────

/**
 * GET /api/v1/autopool/my
 * Get user's AutoPool nodes
 */
export const getMyAutoPoolNodes = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const nodes = await autopool3x3Service.getUserAutoPoolTree(userId);

  res.status(200).json({
    success: true,
    data: {
      nodeCount: nodes.length,
      nodes,
    },
  });
});

/**
 * GET /api/v1/autopool/my-rebirths
 * Get user's rebirth IDs
 */
export const getMyRebirths = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const rebirths = await autopool3x3Service.getUserRebirths(userId);

  res.status(200).json({
    success: true,
    data: {
      rebirthCount: rebirths.length,
      rebirths,
    },
  });
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

  const totalIncome = nodes
    .filter((n) => n.status === "COMPLETED")
    .reduce((sum, node) => {
      // You can add income calculation here
      return sum;
    }, 0);

  res.status(200).json({
    success: true,
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
  });
});

export default {
  getAutoPoolTree,
  getQueueStatus,
  getCompletedNodes,
  getUserAutoPoolDetails,
  processQueueManually,
  getMyAutoPoolNodes,
  getMyRebirths,
  getMyAutoPoolSummary,
};
