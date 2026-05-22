/**
 * AutoPool 3x3 Controller
 *
 * Handles all API endpoints for 3x3 Matrix AutoPool
 */

import { asyncHandler } from "../../core/asyncHandler.js";
import { ApiError } from "../../core/ApiError.js";
import { ApiResponse } from "../../core/ApiResponse.js";
import autopool3x3Service from "./autopool-3x3.service.js";
// import { User } from "../user/user.model.js";
import { AutopoolUserFund } from "./autopool-user-fund.model.js";
import { AutopoolFundTransaction } from "./autopool-fund-transaction.model.js";
import { UpgradeAliasId } from "./upgrade-alias-id.model.js";
import { User } from "../user/user.model.js";

const getAuthenticatedUserId = (req) => req.auth?.userId || req.auth?.sub || null;
const isNodeCompletedForReport = (node = {}) =>
  node.status === "COMPLETED" ||
  node.isCompleted === true ||
  Boolean(node.completedAt) ||
  Number(node.directChildrenCount || 0) >= 3;

const getNodeDisplayStatus = (node = {}) => {
  if (isNodeCompletedForReport(node)) return "COMPLETED";
  if (node.status === "PLACED") return "PLACED";
  return "PENDING";
};

// ─── Admin Routes ────────────────────────────────────────────────────────────

/**
 * GET /api/v1/autopool/admin/tree
 * Get complete AutoPool tree
 */
export const getAutoPoolTree = asyncHandler(async (req, res) => {
  const { limit, root, depth } = req.query;
  const nodes = await autopool3x3Service.getAutoPoolTree({
    limit: limit ? parseInt(limit) : 100,
    root: root || undefined,
    depth: depth !== undefined ? parseInt(depth) : undefined,
  });

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

export const getAutoPoolNodeChildren = asyncHandler(async (req, res) => {
  const { rebirthCode } = req.params;
  const { page, limit } = req.query;
  const result = await autopool3x3Service.getAutoPoolNodeChildren(rebirthCode, {
    page,
    limit,
  });

  res.json(
    new ApiResponse({
      message: "AutoPool node children fetched",
      data: result,
    }),
  );
});

export const getQueueAudit = asyncHandler(async (req, res) => {
  const { fromSerial, toSerial, page, limit } = req.query;
  const result = await autopool3x3Service.getQueueAudit({
    fromSerial,
    toSerial,
    page,
    limit,
  });

  res.json(
    new ApiResponse({
      message: "AutoPool queue audit fetched",
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
  const userId = getAuthenticatedUserId(req);
  if (!userId) throw new ApiError(401, "Unauthorized.");

  const user = await User.findById(userId).select("memberId fullName").lean();
  if (!user) throw new ApiError(404, "User not found");

  const nodes = await autopool3x3Service.getUserAutoPoolTree(userId);

  const mappedNodes = nodes.map((node) => {
    const leanNode = node.toObject ? node.toObject() : node;
    return {
      ...leanNode,
      status: getNodeDisplayStatus(leanNode),
      displayId: leanNode.nodeCode,
      poolNodeId: leanNode.nodeCode,
      parentPoolNodeId: leanNode.matrixParentId
        ? { poolNodeId: leanNode.matrixParentId.nodeCode }
        : null,
      linkedRebirthNodeId: {
        ownerUserId: {
          fullName: user.fullName,
          memberId: user.memberId,
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
    isCompleted: isNodeCompletedForReport(nodes.find((n) => n.nodeCode === r.displayCode)),
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
  const userId = getAuthenticatedUserId(req);
  if (!userId) throw new ApiError(401, "Unauthorized.");

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
  const userId = getAuthenticatedUserId(req);
  if (!userId) throw new ApiError(401, "Unauthorized.");

  const nodes = await autopool3x3Service.getUserAutoPoolTree(userId);
  const rebirths = await autopool3x3Service.getUserRebirths(userId);

  const pendingCount = nodes.filter((n) => getNodeDisplayStatus(n) === "PENDING").length;
  const placedCount = nodes.filter((n) => getNodeDisplayStatus(n) === "PLACED").length;
  const completedCount = nodes.filter((n) => getNodeDisplayStatus(n) === "COMPLETED").length;

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
          status: getNodeDisplayStatus(n),
          childrenCount: n.directChildrenCount,
          createdAt: n.createdAt,
          completedAt: n.completedAt,
        })),
      },
    }),
  );
});

/**
 * GET /api/v1/autopool/3x3/admin/individuals
 * Get paginated list of all users with summarized individual autopool progress
 */
export const getIndividualAutopoolSummary = asyncHandler(async (req, res) => {
  const { search, status, level, round, page, limit, accountType } = req.query;
  const result = await autopool3x3Service.getIndividualAutopoolSummary({
    search,
    status,
    level,
    round,
    page,
    limit,
    accountType,
  });

  res.json(
    new ApiResponse({
      message: "Individual autopool summaries fetched successfully",
      data: result,
    }),
  );
});

/**
 * GET /api/v1/autopool/3x3/admin/individuals/:userId
 * Get detailed individual autopool progress for a user
 */
export const getIndividualAutopoolDetails = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const result = await autopool3x3Service.getIndividualAutopoolDetails(userId);

  res.json(
    new ApiResponse({
      message: "Individual autopool details fetched successfully",
      data: result,
    }),
  );
});

/**
 * GET /api/v1/autopool/3x3/admin/individuals/:userId/tree
 * Get isolated individual autopool tree structure for a user
 */
export const getIndividualAutopoolTree = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const result = await autopool3x3Service.getIndividualAutopoolTree(userId);

  res.json(
    new ApiResponse({
      message: "Individual autopool tree fetched successfully",
      data: result,
    }),
  );
});

/**
 * GET /api/v1/autopool/my/funds
 * Get logged-in user's isolated autopool funds
 */
export const getMyFunds = asyncHandler(async (req, res) => {
  const userId = getAuthenticatedUserId(req);
  if (!userId) throw new ApiError(401, "Unauthorized.");
  let fund = await AutopoolUserFund.findOne({ userId });
  if (!fund) {
    fund = {
      userId,
      completedAutopoolLevel: null,
      poolFundTotal: 0,
      reinvestmentFundTotal: 0,
      withdrawableAutopoolFund: 0,
      upgradeIdCount: 0,
      upgradeDeductionTotal: 0,
      lastCompletedRound: -1,
    };
  }

  res.json(
    new ApiResponse({
      message: "My autopool funds fetched successfully",
      data: fund,
    })
  );
});

/**
 * GET /api/v1/autopool/my/fund-transactions
 * Get logged-in user's autopool fund transactions ledger
 */
export const getMyFundTransactions = asyncHandler(async (req, res) => {
  const userId = getAuthenticatedUserId(req);
  if (!userId) throw new ApiError(401, "Unauthorized.");
  const transactions = await AutopoolFundTransaction.find({ userId }).sort({ createdAt: -1 });

  res.json(
    new ApiResponse({
      message: "My autopool fund transactions fetched successfully",
      data: transactions,
    })
  );
});

/**
 * GET /api/v1/autopool/my/upgrade-ids
 * Get logged-in user's upgrade/alias IDs
 */
export const getMyUpgradeIds = asyncHandler(async (req, res) => {
  const userId = getAuthenticatedUserId(req);
  if (!userId) throw new ApiError(401, "Unauthorized.");
  const upgradeIds = await UpgradeAliasId.find({ userId }).sort({ createdAt: -1 });

  res.json(
    new ApiResponse({
      message: "My autopool upgrade IDs fetched successfully",
      data: upgradeIds,
    })
  );
});

/**
 * GET /api/v1/autopool/admin/user-funds/:userId
 * Admin: Get specific user's isolated autopool funds
 */
export const getUserFundsAdmin = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  let fund = await AutopoolUserFund.findOne({ userId });
  if (!fund) {
    fund = {
      userId,
      completedAutopoolLevel: null,
      poolFundTotal: 0,
      reinvestmentFundTotal: 0,
      withdrawableAutopoolFund: 0,
      upgradeIdCount: 0,
      upgradeDeductionTotal: 0,
      lastCompletedRound: -1,
    };
  }

  res.json(
    new ApiResponse({
      message: "User autopool funds fetched successfully by admin",
      data: fund,
    })
  );
});

/**
 * GET /api/v1/autopool/admin/user-fund-transactions/:userId
 * Admin: Get specific user's autopool fund transactions ledger
 */
export const getUserFundTransactionsAdmin = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const transactions = await AutopoolFundTransaction.find({ userId }).sort({ createdAt: -1 });

  res.json(
    new ApiResponse({
      message: "User autopool fund transactions fetched successfully by admin",
      data: transactions,
    })
  );
});

/**
 * GET /api/v1/autopool/admin/user-upgrade-ids/:userId
 * Admin: Get specific user's upgrade/alias IDs
 */
export const getUserUpgradeIdsAdmin = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const upgradeIds = await UpgradeAliasId.find({ userId }).sort({ createdAt: -1 });

  res.json(
    new ApiResponse({
      message: "User autopool upgrade IDs fetched successfully by admin",
      data: upgradeIds,
    })
  );
});

export const getAliasStatus = asyncHandler(async (req, res) => {
  const { aliasMemberId } = req.params;
  const aliasUser = await User.findOne({ memberId: aliasMemberId, isAliasAccount: true }).lean();
  if (!aliasUser) throw new ApiError(404, "Alias not found");

  const [relation, fund, autopoolDetails, transactions] = await Promise.all([
    UpgradeAliasId.findOne({ aliasMemberId: aliasUser.memberId }).lean(),
    AutopoolUserFund.findOne({ userId: aliasUser._id }).lean(),
    autopool3x3Service.getIndividualAutopoolDetails(aliasUser._id),
    AutopoolFundTransaction.find({ userId: aliasUser._id }).sort({ createdAt: -1 }).lean(),
  ]);

  res.json(
    new ApiResponse({
      message: "Alias autopool status fetched successfully",
      data: {
        aliasUser,
        relation,
        fund,
        autopoolDetails,
        transactions,
      },
    }),
  );
});

/**
 * GET /api/v1/autopool/my/details
 * Get logged-in user's detailed individual autopool progress
 */
export const getMyAutoPoolDetails = asyncHandler(async (req, res) => {
  const userId = getAuthenticatedUserId(req);
  if (!userId) throw new ApiError(401, "Unauthorized.");
  const result = await autopool3x3Service.getIndividualAutopoolDetails(userId);

  res.json(
    new ApiResponse({
      message: "My individual autopool details fetched successfully",
      data: result,
    }),
  );
});

/**
 * GET /api/v1/autopool/my/tree
 * Get logged-in user's isolated individual tree structure
 */
export const getMyAutoPoolTree = asyncHandler(async (req, res) => {
  const userId = getAuthenticatedUserId(req);
  if (!userId) throw new ApiError(401, "Unauthorized.");
  const result = await autopool3x3Service.getIndividualAutopoolTree(userId);

  res.json(
    new ApiResponse({
      message: "My individual autopool tree fetched successfully",
      data: result,
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
  getIndividualAutopoolSummary,
  getIndividualAutopoolDetails,
  getIndividualAutopoolTree,
  getMyFunds,
  getMyFundTransactions,
  getMyUpgradeIds,
  getMyAutoPoolDetails,
  getMyAutoPoolTree,
  getUserFundsAdmin,
  getUserFundTransactionsAdmin,
  getUserUpgradeIdsAdmin,
  getAliasStatus,
};
