import { asyncHandler } from "../../core/asyncHandler.js";
import { ApiResponse } from "../../core/ApiResponse.js";
import { PoolFundLedger } from "./pool-fund-ledger.model.js";
import { CompanyFund, CompanyFundEntry } from "./company-fund.model.js";

/**
 * Get AutoPool Fund Summary (Admin)
 */
export const getPoolFundSummary = asyncHandler(async (req, res) => {
  const [
    totalReinvest,
    totalWithdrawal,
    totalSponsor,
    totalCompany,
    completedRebirths,
    completedLevels,
  ] = await Promise.all([
    PoolFundLedger.aggregate([
      { $match: { type: "REINVEST_TO_POOL_FUND" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    PoolFundLedger.aggregate([
      { $match: { type: "USER_WITHDRAWAL_CREDIT" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    PoolFundLedger.aggregate([
      { $match: { type: "SPONSOR_DEDUCTION" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    CompanyFund.findOne(),
    PoolFundLedger.countDocuments({ type: "REBIRTH_AUTOPOOL_COMPLETED" }),
    PoolFundLedger.countDocuments({ type: "LEVEL_AUTOPOOL_COMPLETED" }),
  ]);

  const data = {
    totalReinvest: totalReinvest[0]?.total || 0,
    totalWithdrawal: totalWithdrawal[0]?.total || 0,
    totalSponsor: totalSponsor[0]?.total || 0,
    totalCompany: totalCompany?.totalCompanyFund || 0,
    completedRebirths,
    completedLevels,
  };

  console.log("[AutoPoolFund] Summary Data:", data);

  res.json(
    new ApiResponse({
      message: "Pool fund summary fetched",
      data,
    })
  );
});

/**
 * Get Pool Fund Ledger (Admin)
 */
export const getPoolFundLedger = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, type, status, userId, rebirthId, level } = req.query;

  const query = {};
  if (type) query.type = type;
  if (status) query.status = status;
  if (userId) query.mainUserId = userId;
  if (rebirthId) query.completedRebirthId = rebirthId;
  if (level !== undefined) query.level = Number(level);

  const ledger = await PoolFundLedger.find(query)
    .populate("mainUserId", "memberId fullName")
    .populate("sponsorUserId", "memberId fullName")
    .populate("completedRebirthId", "nodeCode")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await PoolFundLedger.countDocuments(query);

  res.json(
    new ApiResponse({
      message: "Ledger fetched",
      data: {
        ledger,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / limit),
        },
      },
    })
  );
});

/**
 * Get Company Fund Summary (Admin)
 */
export const getCompanyFundSummary = asyncHandler(async (req, res) => {
  const fund = await CompanyFund.findOne();
  const recentEntries = await CompanyFundEntry.find()
    .populate("fromUserId", "memberId fullName")
    .sort({ createdAt: -1 })
    .limit(50);

  res.json(
    new ApiResponse({
      message: "Company fund summary fetched",
      data: {
        total: fund?.totalCompanyFund || 0,
        entries: recentEntries,
      },
    })
  );
});

/**
 * Get User Pool Fund (Admin/User)
 */
export const getUserPoolFund = asyncHandler(async (req, res) => {
  const userId = req.params.userId || req.auth?.userId || req.auth?.sub;

  const ledger = await PoolFundLedger.find({ mainUserId: userId })
    .populate("completedRebirthId", "nodeCode")
    .sort({ createdAt: -1 });

  res.json(
    new ApiResponse({
      message: "User pool fund ledger fetched",
      data: ledger,
    })
  );
});
