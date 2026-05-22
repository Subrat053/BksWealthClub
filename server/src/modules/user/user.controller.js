import { ApiResponse } from "../../core/ApiResponse.js";
import { asyncHandler } from "../../core/asyncHandler.js";
import { userService } from "./user.service.js";
import { ApiError } from "../../core/ApiError.js";
import { User } from "./user.model.js";
import { UpgradeAliasId } from "../autopool/upgrade-alias-id.model.js";
import { AutopoolUserFund } from "../autopool/autopool-user-fund.model.js";
import { AutopoolFundTransaction } from "../autopool/autopool-fund-transaction.model.js";
import { autopool3x3Service } from "../autopool/autopool-3x3.service.js";

const getCurrentUserId = (req) => req.auth?.userId || req.auth?.sub || null;

const getAliasOwnershipQuery = (userId, aliasMemberId) => ({
  userId,
  aliasMemberId,
  aliasUserId: { $ne: null },
});

const resolveAliasTreeByDepth = (nodes = [], depth = null) => {
  if (!Number.isFinite(Number(depth)) || Number(depth) < 0) return nodes;

  const maxDepth = Number(depth);
  const nodeMap = new Map();
  const parentChildrenMap = new Map();

  for (const node of nodes) {
    const id = String(node._id);
    nodeMap.set(id, node);
  }

  for (const node of nodes) {
    const parentId = node.parentPoolNodeId?._id || node.parentPoolNodeId;
    if (!parentId) continue;
    const parentKey = String(parentId);
    if (!nodeMap.has(parentKey)) continue;
    if (!parentChildrenMap.has(parentKey)) parentChildrenMap.set(parentKey, []);
    parentChildrenMap.get(parentKey).push(node);
  }

  const roots = nodes.filter((node) => {
    const parentId = node.parentPoolNodeId?._id || node.parentPoolNodeId;
    return !parentId || !nodeMap.has(String(parentId));
  });

  const result = [];
  const queue = roots.map((node) => ({ node, depth: 0 }));

  while (queue.length) {
    const current = queue.shift();
    if (!current || current.depth > maxDepth) continue;
    result.push(current.node);

    const currentId = String(current.node._id);
    const children = parentChildrenMap.get(currentId) || [];
    for (const child of children) {
      queue.push({ node: child, depth: current.depth + 1 });
    }
  }

  return result;
};

const buildAliasAutopoolSummary = ({ aliasUser, relation, autopoolDetails, fund, mainUser }) => {
  const userSummary = autopoolDetails?.userSummary || {};
  const fundSummary = userSummary.autopoolFundSummary || {};
  const rebirthDetails = autopoolDetails?.rebirthDetails || [];

  return {
    aliasMemberId: aliasUser?.memberId || relation?.aliasMemberId || relation?.aliasId || null,
    originalMainUserId: mainUser?.memberId || null,
    sponsorId: relation?.sponsorId || aliasUser?.sponsorId || null,
    createdFromAutopoolLevel: relation?.createdFromAutopoolLevel ?? aliasUser?.createdFromAutopoolLevel ?? null,
    autoDepositAmount: aliasUser?.autoDepositAmount ?? aliasUser?.autoCreatedDepositAmount ?? 75,
    createdAt: relation?.createdAt || aliasUser?.createdAt || null,
    latestCompletedLevel: userSummary.latestCompletedLevel ?? userSummary.completedAutopoolLevel ?? fund?.completedAutopoolLevel ?? null,
    activeLevel: userSummary.currentActiveLevel ?? 0,
    totalRebirths: userSummary.totalRebirthsCreated ?? rebirthDetails.length,
    completedRebirths: userSummary.totalCompletedRebirths ?? 0,
    pendingRebirths: userSummary.totalPendingRebirths ?? 0,
    poolFundTotal: fundSummary.poolFundTotal ?? fund?.poolFundTotal ?? 0,
    reinvestmentFundTotal: fundSummary.reinvestmentFundTotal ?? fund?.reinvestmentFundTotal ?? 0,
    withdrawableAutopoolFund: fundSummary.withdrawableAutopoolFund ?? fund?.withdrawableAutopoolFund ?? 0,
    status: relation?.status || (aliasUser?.status ? String(aliasUser.status).toUpperCase() : "ACTIVE"),
  };
};

export const getProfileController = asyncHandler(async (req, res) => {
  const data = await userService.getProfile(req.auth.sub);
  res.json(new ApiResponse({ message: "Profile fetched", data }));
});

export const updateProfileController = asyncHandler(async (req, res) => {
  // Map frontend field names to database field names
  const mappedPayload = {
    fullName: req.body.name || undefined,
    phone: req.body.mobile || undefined,
    bepAddress: req.body.walletAddresses?.[0]?.address || undefined,
  };

  // Remove undefined values
  Object.keys(mappedPayload).forEach((key) => {
    if (mappedPayload[key] === undefined) delete mappedPayload[key];
  });

  const data = await userService.updateProfile(req.auth.sub, mappedPayload);
  res.json(new ApiResponse({ message: "Profile updated", data }));
});

export const changePasswordController = asyncHandler(async (req, res) => {
  const data = await userService.changePassword(req.auth.sub, req.body);
  res.json(new ApiResponse({ message: "Password updated", data }));
});

export const getMyAliasesController = asyncHandler(async (req, res) => {
  const userId = getCurrentUserId(req);
  if (!userId) throw new ApiError(401, "Unauthorized.");

  const relations = await UpgradeAliasId.find({
    userId,
    aliasUserId: { $ne: null },
  })
    .sort({ createdFromAutopoolLevel: -1, aliasSequence: 1 })
    .lean();

  const aliasUserIds = relations.map((alias) => alias.aliasUserId).filter(Boolean);
  const [aliasUsers, funds, mainUser] = await Promise.all([
    aliasUserIds.length
      ? User.find({ _id: { $in: aliasUserIds } }).lean()
      : Promise.resolve([]),
    aliasUserIds.length
      ? AutopoolUserFund.find({ userId: { $in: aliasUserIds } }).lean()
      : Promise.resolve([]),
    User.findById(userId).select("memberId fullName").lean(),
  ]);

  const aliasUserMap = new Map(aliasUsers.map((aliasUser) => [String(aliasUser._id), aliasUser]));
  const fundMap = new Map(funds.map((fund) => [String(fund.userId), fund]));

  const payload = await Promise.all(
    relations.map(async (relation) => {
      const aliasUser = relation.aliasUserId ? aliasUserMap.get(String(relation.aliasUserId)) || null : null;
      const fund = relation.aliasUserId ? fundMap.get(String(relation.aliasUserId)) || null : null;
      const autopoolDetails = aliasUser
        ? await autopool3x3Service.getIndividualAutopoolDetails(aliasUser._id).catch(() => null)
        : null;

      return {
        aliasMemberId: aliasUser?.memberId || relation.aliasMemberId || relation.aliasId,
        originalMainUserId: mainUser?.memberId || String(userId),
        sponsorId: relation.sponsorId || aliasUser?.sponsorId || mainUser?.memberId || String(userId),
        createdFromAutopoolLevel: relation.createdFromAutopoolLevel,
        autoDepositAmount: aliasUser?.autoDepositAmount || aliasUser?.autoCreatedDepositAmount || relation.deductionAmount || 75,
        createdAt: relation.createdAt,
        latestCompletedLevel:
          autopoolDetails?.userSummary?.latestCompletedLevel ??
          autopoolDetails?.userSummary?.completedAutopoolLevel ??
          fund?.completedAutopoolLevel ??
          null,
        activeLevel: autopoolDetails?.userSummary?.currentActiveLevel ?? 0,
        totalRebirths: autopoolDetails?.userSummary?.totalRebirthsCreated ?? autopoolDetails?.rebirthDetails?.length ?? 0,
        completedRebirths: autopoolDetails?.userSummary?.totalCompletedRebirths ?? 0,
        pendingRebirths: autopoolDetails?.userSummary?.totalPendingRebirths ?? 0,
        poolFundTotal: autopoolDetails?.userSummary?.autopoolFundSummary?.poolFundTotal ?? fund?.poolFundTotal ?? 0,
        reinvestmentFundTotal:
          autopoolDetails?.userSummary?.autopoolFundSummary?.reinvestmentFundTotal ?? fund?.reinvestmentFundTotal ?? 0,
        withdrawableAutopoolFund:
          autopoolDetails?.userSummary?.autopoolFundSummary?.withdrawableAutopoolFund ?? fund?.withdrawableAutopoolFund ?? 0,
        status: relation.status || (aliasUser?.status ? String(aliasUser.status).toUpperCase() : "ACTIVE"),
        aliasUserId: aliasUser?._id || relation.aliasUserId || null,
      };
    }),
  );

  res.json(new ApiResponse({ message: "My alias IDs fetched successfully", data: { aliases: payload } }));
});

export const getAliasDetailsController = asyncHandler(async (req, res) => {
  const userId = getCurrentUserId(req);
  if (!userId) throw new ApiError(401, "Unauthorized.");

  const { aliasMemberId } = req.params;
  const relation = await UpgradeAliasId.findOne(getAliasOwnershipQuery(userId, aliasMemberId)).lean();
  if (!relation) throw new ApiError(404, "Alias not found for current user");

  const aliasUser = relation.aliasUserId
    ? await User.findOne({ _id: relation.aliasUserId, isAliasAccount: true }).lean()
    : await User.findOne({ memberId: aliasMemberId, isAliasAccount: true }).lean();
  if (!aliasUser) throw new ApiError(404, "Alias not found");

  const [autopoolDetails, fund, transactions] = await Promise.all([
    autopool3x3Service.getIndividualAutopoolDetails(aliasUser._id),
    AutopoolUserFund.findOne({ userId: aliasUser._id }).lean(),
    AutopoolFundTransaction.find({ userId: aliasUser._id }).sort({ createdAt: -1 }).lean(),
  ]);

  const mainUser = relation.originalMainUserId
    ? await User.findById(relation.originalMainUserId).select("memberId fullName").lean()
    : null;

  res.json(
    new ApiResponse({
      message: "Alias details fetched successfully",
      data: {
        aliasUser,
        relation,
        fund,
        transactions,
        autopoolDetails,
          originalMainUser: mainUser,
        summary: autopoolDetails.userSummary,
        fundSummary: autopoolDetails.userSummary?.autopoolFundSummary || null,
        levelWiseStatus: autopoolDetails.levelWiseStatus || [],
        rebirths: autopoolDetails.rebirthDetails || [],
      },
    }),
  );
});

export const getMemberAliasesController = asyncHandler(async (req, res) => {
  return getMyAliasesController(req, res);
});

export const getMemberAliasAutopoolController = asyncHandler(async (req, res) => {
  const userId = getCurrentUserId(req);
  if (!userId) throw new ApiError(401, "Unauthorized.");

  const { aliasMemberId } = req.params;
  const relation = await UpgradeAliasId.findOne(getAliasOwnershipQuery(userId, aliasMemberId)).lean();
  if (!relation) throw new ApiError(404, "Alias not found for current user");

  const aliasUser = relation.aliasUserId
    ? await User.findOne({ _id: relation.aliasUserId, isAliasAccount: true }).lean()
    : await User.findOne({ memberId: aliasMemberId, isAliasAccount: true }).lean();
  if (!aliasUser) throw new ApiError(404, "Alias not found");

  const [autopoolDetails, fund, transactions] = await Promise.all([
    autopool3x3Service.getIndividualAutopoolDetails(aliasUser._id),
    AutopoolUserFund.findOne({ userId: aliasUser._id }).lean(),
    AutopoolFundTransaction.find({ userId: aliasUser._id }).sort({ createdAt: -1 }).lean(),
  ]);

  const mainUser = relation.originalMainUserId
    ? await User.findById(relation.originalMainUserId).select("memberId fullName").lean()
    : null;

  const summary = buildAliasAutopoolSummary({ aliasUser, relation, autopoolDetails, fund, mainUser });

  res.json(
    new ApiResponse({
      message: "Alias autopool status fetched successfully",
      data: {
        aliasUser,
        relation,
        summary,
        originalMainUser: mainUser,
        levelWiseStatus: autopoolDetails.levelWiseStatus || [],
        rebirths: autopoolDetails.rebirthDetails || [],
        fundSummary: autopoolDetails.userSummary?.autopoolFundSummary || null,
        fund,
        transactions,
        autopoolDetails,
      },
    }),
  );
});

export const getMemberAliasTreeController = asyncHandler(async (req, res) => {
  const userId = getCurrentUserId(req);
  if (!userId) throw new ApiError(401, "Unauthorized.");

  const { aliasMemberId } = req.params;
  const depth = req.query.depth !== undefined ? Number(req.query.depth) : null;

  const relation = await UpgradeAliasId.findOne(getAliasOwnershipQuery(userId, aliasMemberId)).lean();
  if (!relation) throw new ApiError(404, "Alias not found for current user");

  const aliasUser = relation.aliasUserId
    ? await User.findOne({ _id: relation.aliasUserId, isAliasAccount: true }).lean()
    : await User.findOne({ memberId: aliasMemberId, isAliasAccount: true }).lean();
  if (!aliasUser) throw new ApiError(404, "Alias not found");

  const mainUser = relation.originalMainUserId
    ? await User.findById(relation.originalMainUserId).select("memberId fullName").lean()
    : null;

  const tree = await autopool3x3Service.getIndividualAutopoolTree(aliasUser._id);
  const resolvedTree = resolveAliasTreeByDepth(tree, depth);

  res.json(
    new ApiResponse({
      message: "Alias autopool tree fetched successfully",
      data: {
        aliasUser,
        relation,
        originalMainUser: mainUser,
        tree: resolvedTree,
        depth: Number.isFinite(depth) ? depth : null,
      },
    }),
  );
});
