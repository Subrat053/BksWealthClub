import mongoose from "mongoose";
import { DepositModel } from "../deposit/deposit.model.js";
import { User } from "../user/user.model.js";
import { WalletModel } from "../user/wallet.model.js";
import { RebirthModel } from "./rebirth.model.js";
import { IncomeTransactionModel } from "./incomeTransaction.model.js";
import { SuperAdminFundModel, getOrCreateFund } from "./superAdminFund.model.js";
import {
  DEPOSIT_AMOUNT,
  RB1_AMOUNT,
  RB2_AMOUNT,
  SPONSOR_TOTAL,
  COMPANY_FUND_TOTAL,
  ACHIEVER_FUND_TOTAL,
  ADMIN_FUND_TOTAL,
  LEVEL_INCOME_RULES,
  INCOME_TYPES,
} from "./income.constants.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Round to 2 decimal places to avoid floating-point noise */
const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Walk the sponsor/referrer chain upward from a user.
 * Returns an array of { userId, level } for up to `maxLevels` uplines.
 *
 * Uses `referredByUserId` (ObjectId) on the User model — the same field
 * the referral tree uses — so the upline walk is consistent.
 */
async function getUplineChain(userId, maxLevels = 9, session = null) {
  const uplines = [];
  let currentUserId = userId;

  for (let level = 1; level <= maxLevels; level++) {
    const opts = session ? { session } : {};
    const currentUser = await User.findById(currentUserId, "referredByUserId", opts).lean();

    if (!currentUser?.referredByUserId) break;

    const sponsorId = currentUser.referredByUserId;

    // Verify the sponsor user actually exists and is a real user
    const sponsor = await User.findById(sponsorId, "_id isActivated status", opts).lean();
    if (!sponsor) break;

    uplines.push({
      userId: sponsor._id,
      level,
      isActive: sponsor.isActivated && sponsor.status === "active",
    });

    currentUserId = sponsor._id;
  }

  return uplines;
}

// ─── Main Distribution Function ──────────────────────────────────────────────

/**
 * Distribute the $75 deposit income for a given deposit.
 *
 * This function is idempotent: if the deposit has already been distributed,
 * it will refuse to run again.
 *
 * All operations run inside a MongoDB transaction so either everything
 * succeeds or nothing is written.
 *
 * @param {Object} params
 * @param {string|ObjectId} params.userId  - The depositing user's _id
 * @param {string|ObjectId} params.depositId - The approved deposit's _id
 * @returns {Object} Full distribution summary
 */
export async function distributeDepositIncome({ userId, depositId, session }) {
  if (!session) throw new Error("A MongoDB session is required to distribute income");

  try {
    // ── 1. Fetch and validate deposit ────────────────────────────────────────
    const deposit = await DepositModel.findById(depositId).session(session);
    if (!deposit) throw new Error("Deposit not found");
    if (deposit.status !== "approved") {
      throw new Error(`Deposit status is "${deposit.status}", expected "approved"`);
    }
    if (deposit.amount !== DEPOSIT_AMOUNT) {
      throw new Error(
        `Deposit amount is $${deposit.amount}, expected $${DEPOSIT_AMOUNT}`,
      );
    }
    if (deposit.incomeDistributed === true) {
      throw new Error("Income already distributed for this deposit (idempotency check)");
    }

    // ── 2. Fetch the depositing user ─────────────────────────────────────────
    const user = await User.findById(userId).session(session).lean();
    if (!user) throw new Error("Depositing user not found");

    // ── 3. Ensure the SuperAdminFund singleton exists ────────────────────────
    await getOrCreateFund(session);

    // ── 4. Track all transactions and total distributed ──────────────────────
    const txnDocs = [];
    let totalDistributed = 0;

    // ── 5. Create 2 Rebirth IDs ──────────────────────────────────────────────
    const rb1Code = `${user.memberId}-RB1`;
    const rb2Code = `${user.memberId}-RB2`;

    // Check if rebirths already exist for this deposit (edge case / retry)
    const existingRebirths = await RebirthModel.find({
      sourceDepositId: depositId,
    }).session(session);

    let rb1, rb2;
    if (existingRebirths.length >= 2) {
      rb1 = existingRebirths.find((r) => r.sequenceNo === 1);
      rb2 = existingRebirths.find((r) => r.sequenceNo === 2);
    } else {
      [rb1] = await RebirthModel.create(
        [
          {
            userId,
            rebirthCode: rb1Code,
            sequenceNo: 1,
            walletBalance: 0,
            sourceDepositId: depositId,
          },
        ],
        { session },
      );
      [rb2] = await RebirthModel.create(
        [
          {
            userId,
            rebirthCode: rb2Code,
            sequenceNo: 2,
            walletBalance: 0,
            sourceDepositId: depositId,
          },
        ],
        { session },
      );
    }

    // ── 6. Credit RB1 wallet $20 ─────────────────────────────────────────────
    await RebirthModel.findByIdAndUpdate(
      rb1._id,
      { $inc: { walletBalance: RB1_AMOUNT } },
      { session },
    );
    txnDocs.push({
      userId,
      fromUserId: userId,
      depositId,
      rebirthId: rb1._id,
      type: INCOME_TYPES.RB_INCOME,
      amount: RB1_AMOUNT,
      status: "CREDITED",
      remarks: `Rebirth RB1 (${rb1Code}) wallet credit of $${RB1_AMOUNT}`,
    });
    totalDistributed = round2(totalDistributed + RB1_AMOUNT);

    // ── 7. Credit RB2 wallet $20 ─────────────────────────────────────────────
    await RebirthModel.findByIdAndUpdate(
      rb2._id,
      { $inc: { walletBalance: RB2_AMOUNT } },
      { session },
    );
    txnDocs.push({
      userId,
      fromUserId: userId,
      depositId,
      rebirthId: rb2._id,
      type: INCOME_TYPES.RB_INCOME,
      amount: RB2_AMOUNT,
      status: "CREDITED",
      remarks: `Rebirth RB2 (${rb2Code}) wallet credit of $${RB2_AMOUNT}`,
    });
    totalDistributed = round2(totalDistributed + RB2_AMOUNT);

    // ── 8. Sponsor Income ($5) ───────────────────────────────────────────────
    const sponsorUserId = user.referredByUserId || user.sponsorUserId || null;
    let sponsorCredited = false;

    if (sponsorUserId) {
      const sponsor = await User.findById(sponsorUserId, "_id isActivated status")
        .session(session)
        .lean();

      if (sponsor) {
        // Credit sponsor's withdrawableFund
        await WalletModel.findOneAndUpdate(
          { userRef: sponsorUserId },
          { $inc: { withdrawableFund: SPONSOR_TOTAL } },
          { upsert: true, session },
        );

        txnDocs.push({
          userId: sponsorUserId,
          fromUserId: userId,
          depositId,
          type: INCOME_TYPES.SPONSOR_INCOME,
          amount: SPONSOR_TOTAL,
          status: "CREDITED",
          remarks: `Sponsor income $${SPONSOR_TOTAL} from ${user.memberId} deposit`,
        });

        totalDistributed = round2(totalDistributed + SPONSOR_TOTAL);
        sponsorCredited = true;
      }
    }

    // If no sponsor → leftover to company fund
    if (!sponsorCredited) {
      await SuperAdminFundModel.findOneAndUpdate(
        {},
        { $inc: { leftoverFund: SPONSOR_TOTAL, companyFund: SPONSOR_TOTAL } },
        { session },
      );

      txnDocs.push({
        fromUserId: userId,
        depositId,
        type: INCOME_TYPES.LEFTOVER_TO_COMPANY,
        amount: SPONSOR_TOTAL,
        status: "CREDITED",
        remarks: `Sponsor income $${SPONSOR_TOTAL} → company (no sponsor found)`,
      });

      totalDistributed = round2(totalDistributed + SPONSOR_TOTAL);
    }

    // ── 9. SuperAdmin Company Fund ($5) ──────────────────────────────────────
    await SuperAdminFundModel.findOneAndUpdate(
      {},
      { $inc: { companyFund: COMPANY_FUND_TOTAL } },
      { session },
    );
    txnDocs.push({
      fromUserId: userId,
      depositId,
      type: INCOME_TYPES.COMPANY_FUND,
      amount: COMPANY_FUND_TOTAL,
      status: "CREDITED",
      remarks: `Company fund $${COMPANY_FUND_TOTAL} from ${user.memberId} deposit`,
    });
    totalDistributed = round2(totalDistributed + COMPANY_FUND_TOTAL);

    // ── 10. SuperAdmin Achiever Fund ($4) ────────────────────────────────────
    await SuperAdminFundModel.findOneAndUpdate(
      {},
      { $inc: { achieverFund: ACHIEVER_FUND_TOTAL } },
      { session },
    );
    txnDocs.push({
      fromUserId: userId,
      depositId,
      type: INCOME_TYPES.ACHIEVER_FUND,
      amount: ACHIEVER_FUND_TOTAL,
      status: "CREDITED",
      remarks: `Achiever fund $${ACHIEVER_FUND_TOTAL} from ${user.memberId} deposit`,
    });
    totalDistributed = round2(totalDistributed + ACHIEVER_FUND_TOTAL);

    // ── 11. SuperAdmin Admin Fund ($5) ───────────────────────────────────────
    await SuperAdminFundModel.findOneAndUpdate(
      {},
      { $inc: { adminFund: ADMIN_FUND_TOTAL } },
      { session },
    );
    txnDocs.push({
      fromUserId: userId,
      depositId,
      type: INCOME_TYPES.ADMIN_FUND,
      amount: ADMIN_FUND_TOTAL,
      status: "CREDITED",
      remarks: `Admin fund $${ADMIN_FUND_TOTAL} from ${user.memberId} deposit`,
    });
    totalDistributed = round2(totalDistributed + ADMIN_FUND_TOTAL);

    // ── 12. 9-Level Income ($16 total) ───────────────────────────────────────
    const uplines = await getUplineChain(userId, 9, session);
    let levelLeftover = 0;

    for (const rule of LEVEL_INCOME_RULES) {
      const upline = uplines.find((u) => u.level === rule.level);

      if (upline) {
        // Credit this upline's withdrawableFund
        await WalletModel.findOneAndUpdate(
          { userRef: upline.userId },
          { $inc: { withdrawableFund: rule.total } },
          { upsert: true, session },
        );

        txnDocs.push({
          userId: upline.userId,
          fromUserId: userId,
          depositId,
          type: INCOME_TYPES.LEVEL_INCOME,
          level: rule.level,
          amount: rule.total,
          status: "CREDITED",
          remarks: `Level ${rule.level} income $${rule.total} from ${user.memberId} deposit`,
        });

        totalDistributed = round2(totalDistributed + rule.total);
      } else {
        // No upline at this level → leftover
        levelLeftover = round2(levelLeftover + rule.total);
      }
    }

    // Send any level leftover to company fund
    if (levelLeftover > 0) {
      await SuperAdminFundModel.findOneAndUpdate(
        {},
        {
          $inc: {
            leftoverFund: levelLeftover,
            companyFund: levelLeftover,
          },
        },
        { session },
      );

      txnDocs.push({
        fromUserId: userId,
        depositId,
        type: INCOME_TYPES.LEFTOVER_TO_COMPANY,
        amount: levelLeftover,
        status: "CREDITED",
        remarks: `Level income leftover $${levelLeftover} → company (missing uplines)`,
      });

      totalDistributed = round2(totalDistributed + levelLeftover);
    }

    // ── 13. Final remainder check ────────────────────────────────────────────
    // If floating-point math leaves a remainder, send it to company fund.
    const remainder = round2(DEPOSIT_AMOUNT - totalDistributed);
    if (remainder > 0) {
      await SuperAdminFundModel.findOneAndUpdate(
        {},
        { $inc: { leftoverFund: remainder, companyFund: remainder } },
        { session },
      );

      txnDocs.push({
        fromUserId: userId,
        depositId,
        type: INCOME_TYPES.LEFTOVER_TO_COMPANY,
        amount: remainder,
        status: "CREDITED",
        remarks: `Calculation remainder $${remainder} → company fund`,
      });

      totalDistributed = round2(totalDistributed + remainder);
    }

    // ── 14. Persist all IncomeTransaction documents ──────────────────────────
    await IncomeTransactionModel.insertMany(txnDocs, { session });

    // ── 15. Mark deposit as distributed ──────────────────────────────────────
    await DepositModel.findByIdAndUpdate(
      depositId,
      {
        incomeDistributed: true,
        distributedAt: new Date(),
      },
      { session },
    );

    // Transaction is committed by the caller (deposit service)

    // ── 17. Build summary ────────────────────────────────────────────────────
    return {
      success: true,
      depositId,
      userId,
      memberId: user.memberId,
      rebirths: {
        rb1: { code: rb1Code, walletCredit: RB1_AMOUNT },
        rb2: { code: rb2Code, walletCredit: RB2_AMOUNT },
      },
      sponsorIncome: sponsorCredited
        ? { sponsorUserId, amount: SPONSOR_TOTAL }
        : { sponsorUserId: null, amount: 0, leftover: SPONSOR_TOTAL },
      superAdminFunds: {
        companyFund: COMPANY_FUND_TOTAL,
        achieverFund: ACHIEVER_FUND_TOTAL,
        adminFund: ADMIN_FUND_TOTAL,
      },
      levelIncome: {
        levelsDistributed: uplines.length,
        leftover: levelLeftover,
      },
      remainder,
      totalDistributed,
      transactionCount: txnDocs.length,
    };
  } catch (err) {
    throw err;
  }
}

// ─── Query Helpers ────────────────────────────────────────────────────────────

/**
 * Get the distribution breakdown for a specific deposit.
 */
export async function getDistributionByDeposit(depositId) {
  const transactions = await IncomeTransactionModel.find({ depositId })
    .populate("userId", "memberId fullName email")
    .populate("fromUserId", "memberId fullName email")
    .populate("rebirthId", "rebirthCode sequenceNo walletBalance")
    .sort({ createdAt: 1 })
    .lean();

  const deposit = await DepositModel.findById(depositId)
    .populate("userRef", "memberId fullName email")
    .lean();

  return { deposit, transactions, count: transactions.length };
}

/**
 * Get all income transactions (admin view) with pagination.
 */
export async function getAllIncomeLogs({ page = 1, limit = 50, type = null }) {
  const filter = {};
  if (type) filter.type = type;

  const skip = (page - 1) * limit;
  const [docs, total] = await Promise.all([
    IncomeTransactionModel.find(filter)
      .populate("userId", "memberId fullName email")
      .populate("fromUserId", "memberId fullName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    IncomeTransactionModel.countDocuments(filter),
  ]);

  return {
    logs: docs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get income transactions for a specific user (admin or user self-view).
 */
export async function getUserIncomeLogs(targetUserId, { page = 1, limit = 50 } = {}) {
  const filter = { userId: targetUserId };
  const skip = (page - 1) * limit;

  const [docs, total] = await Promise.all([
    IncomeTransactionModel.find(filter)
      .populate("fromUserId", "memberId fullName email")
      .populate("rebirthId", "rebirthCode sequenceNo")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    IncomeTransactionModel.countDocuments(filter),
  ]);

  return { logs: docs, total, page, limit, totalPages: Math.ceil(total / limit) };
}

/**
 * Get the admin funds summary + aggregate income stats + lastCredits.
 */
export async function getFundsSummary() {
  const fund = await SuperAdminFundModel.findOne().lean();

  // Aggregate totals from IncomeTransaction
  const [incomeAgg] = await IncomeTransactionModel.aggregate([
    {
      $group: {
        _id: null,
        totalUserIncome: {
          $sum: {
            $cond: [
              { $in: ["$type", [INCOME_TYPES.SPONSOR_INCOME, INCOME_TYPES.LEVEL_INCOME]] },
              "$amount",
              0,
            ],
          },
        },
        totalRebirthWallet: {
          $sum: {
            $cond: [{ $eq: ["$type", INCOME_TYPES.RB_INCOME] }, "$amount", 0],
          },
        },
        totalDepositsDistributed: {
          $sum: {
            $cond: [{ $eq: ["$type", INCOME_TYPES.RB_INCOME] }, 1, 0],
          },
        },
      },
    },
  ]);

  // Get last credit for each fund type
  const fundTypes = [
    INCOME_TYPES.COMPANY_FUND,
    INCOME_TYPES.ADMIN_FUND,
    INCOME_TYPES.ACHIEVER_FUND,
    INCOME_TYPES.LEFTOVER_TO_COMPANY,
  ];
  const lastCredits = {};
  for (const fType of fundTypes) {
    const lastTxn = await IncomeTransactionModel.findOne({ type: fType })
      .sort({ createdAt: -1 })
      .populate("fromUserId", "memberId fullName")
      .lean();
    if (lastTxn) {
      lastCredits[fType] = {
        amount: lastTxn.amount,
        fromUser: lastTxn.fromUserId?.memberId || "System",
        fromUserName: lastTxn.fromUserId?.fullName || "",
        depositId: lastTxn.depositId,
        creditedAt: lastTxn.createdAt,
      };
    }
  }

  // Count transactions per fund type
  const fundTxnCounts = await IncomeTransactionModel.aggregate([
    { $match: { type: { $in: fundTypes } } },
    { $group: { _id: "$type", count: { $sum: 1 } } },
  ]);
  const txnCountMap = {};
  fundTxnCounts.forEach((r) => { txnCountMap[r._id] = r.count; });

  const saFund = fund || { companyFund: 0, achieverFund: 0, adminFund: 0, leftoverFund: 0 };

  return {
    companyFund: saFund.companyFund,
    achieverFund: saFund.achieverFund,
    adminFund: saFund.adminFund,
    leftoverFund: saFund.leftoverFund,
    totalSuperAdminFund: round2(
      saFund.companyFund + saFund.achieverFund + saFund.adminFund,
    ),
    totalUserIncomeDistributed: incomeAgg?.totalUserIncome || 0,
    totalRebirthWalletDistributed: incomeAgg?.totalRebirthWallet || 0,
    totalDepositsDistributed: Math.floor((incomeAgg?.totalDepositsDistributed || 0) / 2),
    lastCredits,
    transactionCounts: {
      companyFund: txnCountMap[INCOME_TYPES.COMPANY_FUND] || 0,
      adminFund: txnCountMap[INCOME_TYPES.ADMIN_FUND] || 0,
      achieverFund: txnCountMap[INCOME_TYPES.ACHIEVER_FUND] || 0,
      leftoverFund: txnCountMap[INCOME_TYPES.LEFTOVER_TO_COMPANY] || 0,
    },
  };
}

/**
 * Get fund-related transactions (COMPANY_FUND, ADMIN_FUND, ACHIEVER_FUND, LEFTOVER_TO_COMPANY).
 */
export async function getFundTransactions({
  page = 1,
  limit = 50,
  fundType = null,
  dateFrom = null,
  dateTo = null,
  userId = null,
  depositId = null,
} = {}) {
  const fundTypes = [
    INCOME_TYPES.COMPANY_FUND,
    INCOME_TYPES.ADMIN_FUND,
    INCOME_TYPES.ACHIEVER_FUND,
    INCOME_TYPES.LEFTOVER_TO_COMPANY,
  ];

  const filter = { type: { $in: fundTypes } };
  if (fundType && fundTypes.includes(fundType)) {
    filter.type = fundType;
  }
  if (userId) filter.fromUserId = userId;
  if (depositId) filter.depositId = depositId;
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }

  const skip = (page - 1) * limit;
  const [docs, total] = await Promise.all([
    IncomeTransactionModel.find(filter)
      .populate("fromUserId", "memberId fullName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    IncomeTransactionModel.countDocuments(filter),
  ]);

  return { logs: docs, total, page, limit, totalPages: Math.ceil(total / limit) };
}

/**
 * Get user's rebirth IDs.
 */
export async function getUserRebirthIds(userId) {
  return RebirthModel.find({ userId })
    .populate("sourceDepositId", "amount status createdAt")
    .sort({ createdAt: -1 })
    .lean();
}

/**
 * Get user's wallet including withdrawableFund.
 */
export async function getUserWallet(userId) {
  let wallet = await WalletModel.findOne({ userRef: userId }).lean();
  if (!wallet) {
    wallet = {
      mainWallet: 0,
      fundWallet: 0,
      holdingWallet: 0,
      lockedAmount: 0,
      withdrawableFund: 0,
    };
  }

  // Also get rebirth wallet totals
  const rebirths = await RebirthModel.find({ userId }).lean();
  const totalRebirthBalance = rebirths.reduce((sum, r) => sum + (r.walletBalance || 0), 0);

  return {
    ...wallet,
    rebirthWallets: rebirths.map((r) => ({
      rebirthCode: r.rebirthCode,
      sequenceNo: r.sequenceNo,
      walletBalance: r.walletBalance,
    })),
    totalRebirthBalance: round2(totalRebirthBalance),
  };
}

/**
 * Get admin user list that includes rebirth IDs alongside normal users.
 * Merges User docs and Rebirth docs into a unified list.
 */
export async function getAdminUsersWithRebirths({
  search = "",
  status = "",
  type = "all", // "all" | "users" | "rebirths"
} = {}) {
  const result = [];

  // Normal users
  if (type === "all" || type === "users") {
    const userFilter = {};
    if (status) userFilter.status = status;
    if (search) {
      userFilter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { memberId: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(userFilter)
      .select("-passwordHash -twoFactorSecret -twoFactorPendingSecret -plainPassword")
      .populate("sponsorUserId", "fullName memberId")
      .populate("referredByUserId", "fullName memberId")
      .sort({ createdAt: -1 })
      .lean();

    for (const u of users) {
      // Get wallet info
      const wallet = await WalletModel.findOne({ userRef: u._id }).lean();
      const rebirths = await RebirthModel.find({ userId: u._id }).lean();
      const totalRebirthBalance = rebirths.reduce((s, r) => s + (r.walletBalance || 0), 0);

      result.push({
        _id: u._id,
        memberId: u.memberId,
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        sponsorId: u.sponsorId,
        sponsorName: u.sponsorUserId?.fullName || u.referredByUserId?.fullName || "System",
        status: u.status,
        isRebirth: false,
        isActivated: u.isActivated,
        isEmailVerified: u.isEmailVerified,
        twoFactorEnabled: u.twoFactorEnabled,
        displayLabel: u.fullName,
        withdrawableFund: wallet?.withdrawableFund || 0,
        totalRebirthBalance: round2(totalRebirthBalance),
        rebirthCount: rebirths.length,
        createdAt: u.createdAt,
      });
    }
  }

  // Rebirth IDs
  if (type === "all" || type === "rebirths") {
    const rbFilter = {};
    if (search) {
      rbFilter.$or = [
        { rebirthCode: { $regex: search, $options: "i" } },
      ];
    }

    const rebirths = await RebirthModel.find(rbFilter)
      .populate("userId", "fullName memberId email phone sponsorId status")
      .sort({ createdAt: -1 })
      .lean();

    for (const rb of rebirths) {
      const parentUser = rb.userId;
      if (!parentUser) continue;
      // Filter by status if specified
      if (status && parentUser.status !== status) continue;

      result.push({
        _id: rb._id,
        memberId: rb.rebirthCode,
        fullName: `${parentUser.fullName} (R)`,
        email: parentUser.email,
        phone: parentUser.phone,
        sponsorId: parentUser.sponsorId,
        sponsorName: "",
        status: parentUser.status,
        isRebirth: true,
        isActivated: true,
        isEmailVerified: true,
        twoFactorEnabled: false,
        displayLabel: `${parentUser.fullName} (R)`,
        originalUserId: parentUser._id,
        originalMemberId: parentUser.memberId,
        rebirthCode: rb.rebirthCode,
        sequenceNo: rb.sequenceNo,
        walletBalance: rb.walletBalance,
        withdrawableFund: 0,
        totalRebirthBalance: rb.walletBalance,
        rebirthCount: 0,
        createdAt: rb.createdAt,
      });
    }
  }

  // Sort by createdAt descending
  result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return result;
}

/**
 * Get user income summary for admin detail view.
 */
export async function getUserIncomeSummary(userId) {
  const wallet = await getUserWallet(userId);
  const rebirths = await getUserRebirthIds(userId);

  // Aggregate income by type for this user
  const incomeAgg = await IncomeTransactionModel.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: "$type",
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
  ]);

  const incomeByType = {};
  incomeAgg.forEach((r) => {
    incomeByType[r._id] = { total: r.total, count: r.count };
  });

  // Recent transactions
  const recentLogs = await IncomeTransactionModel.find({ userId })
    .populate("fromUserId", "memberId fullName")
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  return {
    wallet,
    rebirths,
    incomeByType,
    recentLogs,
  };
}
