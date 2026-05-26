import mongoose from "mongoose";
import { WalletSummaryModel } from "./wallet-summary.model.js";
import { WalletLedgerModel } from "./wallet-ledger.model.js";
import { WalletTransferModel } from "./wallet-transfer.model.js";
import { WithdrawalRequestModel } from "./withdrawal-request.model.js";
import { User } from "../user/user.model.js";
import { ApiError } from "../../core/ApiError.js";

// Helper to round numbers to 2 decimal places to avoid floating point issues
const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;

export function recalculateBalances(summary) {
  const autopool = round2(summary.autopoolWithdrawableBalance);
  const sponsor = round2(summary.sponsorIncomeBalance);
  const level = round2(summary.levelIncomeBalance);
  const transferRecv = round2(summary.walletTransferReceivedBalance);
  const transferSent = round2(summary.walletTransferSentBalance);
  const locked = round2(summary.lockedWithdrawalBalance);
  const withdrawn = round2(summary.lifetimeWithdrawn);
  const charges = round2(summary.lifetimeAdminCharges);

  // totalWithdrawableBalance formula
  summary.totalWithdrawableBalance = round2(
    autopool +
    sponsor +
    level +
    transferRecv -
    transferSent -
    locked
  );

  // availableBalance formula
  summary.availableBalance = round2(
    autopool +
    sponsor +
    level +
    transferRecv -
    transferSent -
    locked -
    withdrawn -
    charges
  );
}

export async function getOrCreateSummary(userId, session = null) {
  let summary = await WalletSummaryModel.findOne({ userId }).session(session);
  if (!summary) {
    summary = new WalletSummaryModel({
      userId,
      autopoolWithdrawableBalance: 0,
      sponsorIncomeBalance: 0,
      levelIncomeBalance: 0,
      walletTransferReceivedBalance: 0,
      walletTransferSentBalance: 0,
      lockedWithdrawalBalance: 0,
      lifetimeWithdrawn: 0,
      lifetimeAdminCharges: 0,
      lifetimeTransferredOut: 0,
      lifetimeTransferredIn: 0,
    });
    recalculateBalances(summary);
    await summary.save({ session });
  }
  return summary;
}

export const walletService = {
  getOrCreateSummary,
  recalculateBalances,

  getSummary: async (userId) => {
    return getOrCreateSummary(userId);
  },

  getLedger: async (userId, { page = 1, limit = 50 } = {}) => {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      WalletLedgerModel.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      WalletLedgerModel.countDocuments({ userId }),
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  createWithdrawalRequest: async ({ userId, requestedAmount, walletAddress, network, userNote = "" }) => {
    if (requestedAmount <= 0) {
      throw new ApiError(400, "Withdrawal amount must be greater than zero.");
    }
    if (!walletAddress || walletAddress.trim().length === 0) {
      throw new ApiError(400, "A valid wallet address is required.");
    }
    if (!network || network.trim().length === 0) {
      throw new ApiError(400, "Network is required.");
    }

    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      // 1. Fetch user status
      const user = await User.findById(userId).session(session);
      if (!user) throw new ApiError(404, "User not found.");
      if (user.status !== "active") {
        throw new ApiError(400, "Withdrawal blocked. User account is not active.");
      }

      // 2. Fetch and lock summary
      const summary = await getOrCreateSummary(userId, session);

      // 3. Compute charges
      const adminChargePercent = 5;
      const adminChargeAmount = round2(requestedAmount * 0.05);
      const totalDebit = round2(requestedAmount + adminChargeAmount);

      // 4. Validate remaining available balance
      if (summary.availableBalance - totalDebit < 20) {
        throw new ApiError(
          400,
          `Withdrawal would bring remaining balance below the minimum limit of 20 USDT. Your current available balance is ${summary.availableBalance} USDT.`
        );
      }

      // 5. Create WithdrawalRequest
      const [withdrawal] = await WithdrawalRequestModel.create(
        [
          {
            userId,
            requestedAmount,
            adminChargePercent,
            adminChargeAmount,
            totalDebit,
            walletAddress,
            network,
            userNote,
            status: "PENDING_ADMIN_APPROVAL",
            requestedAt: new Date(),
          },
        ],
        { session }
      );

      // 6. Lock balance
      summary.lockedWithdrawalBalance = round2(summary.lockedWithdrawalBalance + totalDebit);
      recalculateBalances(summary);
      await summary.save({ session });

      // 7. Write Ledger
      await WalletLedgerModel.create(
        [
          {
            userId,
            type: "WITHDRAWAL_LOCK",
            direction: "LOCK",
            amount: totalDebit,
            balanceBefore: round2(summary.availableBalance + totalDebit),
            balanceAfter: summary.availableBalance,
            sourceId: withdrawal._id,
            sourceType: "WITHDRAWAL",
            description: `Locked $${totalDebit} ($${requestedAmount} + 5% admin fee) for withdrawal`,
          },
        ],
        { session }
      );

      await session.commitTransaction();
      return withdrawal;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  approveWithdrawalRequest: async ({ withdrawalId, adminId }) => {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const request = await WithdrawalRequestModel.findById(withdrawalId).session(session);
      if (!request) throw new ApiError(404, "Withdrawal request not found.");
      if (request.status !== "PENDING_ADMIN_APPROVAL") {
        throw new ApiError(400, `Request status is ${request.status}, expected PENDING_ADMIN_APPROVAL.`);
      }

      request.status = "APPROVED";
      request.approvedAt = new Date();
      request.approvedBy = adminId;
      await request.save({ session });

      await session.commitTransaction();
      return request;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  rejectWithdrawalRequest: async ({ withdrawalId, adminId, reason }) => {
    if (!reason || reason.trim().length === 0) {
      throw new ApiError(400, "Rejection reason is required.");
    }

    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const request = await WithdrawalRequestModel.findById(withdrawalId).session(session);
      if (!request) throw new ApiError(404, "Withdrawal request not found.");
      if (request.status !== "PENDING_ADMIN_APPROVAL" && request.status !== "APPROVED") {
        throw new ApiError(400, `Cannot reject request with status ${request.status}.`);
      }

      request.status = "REJECTED";
      request.rejectedAt = new Date();
      request.rejectionReason = reason;
      request.rejectedBy = adminId;
      await request.save({ session });

      // Unlock amount back to available balance
      const summary = await getOrCreateSummary(request.userId, session);
      summary.lockedWithdrawalBalance = round2(summary.lockedWithdrawalBalance - request.totalDebit);
      recalculateBalances(summary);
      await summary.save({ session });

      // Ledger entry
      await WalletLedgerModel.create(
        [
          {
            userId: request.userId,
            type: "WITHDRAWAL_REJECTED_UNLOCK",
            direction: "UNLOCK",
            amount: request.totalDebit,
            balanceBefore: round2(summary.availableBalance - request.totalDebit),
            balanceAfter: summary.availableBalance,
            sourceId: request._id,
            sourceType: "WITHDRAWAL",
            description: `Unlocked $${request.totalDebit} due to rejection of withdrawal request. Reason: ${reason}`,
          },
        ],
        { session }
      );

      await session.commitTransaction();
      return request;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  markPaidWithdrawalRequest: async ({ withdrawalId, adminId, txHash, adminNote = "" }) => {
    if (!txHash || txHash.trim().length === 0) {
      throw new ApiError(400, "Transaction Hash is required to mark request as Paid.");
    }

    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const request = await WithdrawalRequestModel.findById(withdrawalId).session(session);
      if (!request) throw new ApiError(404, "Withdrawal request not found.");
      if (request.status !== "APPROVED" && request.status !== "PENDING_ADMIN_APPROVAL") {
        throw new ApiError(400, `Request status must be APPROVED or PENDING_ADMIN_APPROVAL, currently ${request.status}.`);
      }

      request.status = "PAID";
      request.paidAt = new Date();
      request.txHash = txHash;
      request.adminNote = adminNote;
      request.paidBy = adminId;
      await request.save({ session });

      // Finalize debit in summary
      const summary = await getOrCreateSummary(request.userId, session);
      
      summary.lockedWithdrawalBalance = round2(summary.lockedWithdrawalBalance - request.totalDebit);
      summary.lifetimeWithdrawn = round2(summary.lifetimeWithdrawn + request.requestedAmount);
      summary.lifetimeAdminCharges = round2(summary.lifetimeAdminCharges + request.adminChargeAmount);
      
      recalculateBalances(summary);
      await summary.save({ session });

      // Create Ledger entry for Paid
      await WalletLedgerModel.create(
        [
          {
            userId: request.userId,
            type: "WITHDRAWAL_PAID",
            direction: "DEBIT",
            amount: request.requestedAmount,
            balanceBefore: round2(summary.availableBalance + request.totalDebit),
            balanceAfter: round2(summary.availableBalance + request.adminChargeAmount),
            sourceId: request._id,
            sourceType: "WITHDRAWAL",
            description: `Permanent withdrawal of $${request.requestedAmount} paid (Tx: ${txHash})`,
          },
        ],
        { session }
      );

      // Create Ledger entry for Admin Charge
      await WalletLedgerModel.create(
        [
          {
            userId: request.userId,
            type: "WITHDRAWAL_ADMIN_CHARGE",
            direction: "DEBIT",
            amount: request.adminChargeAmount,
            balanceBefore: round2(summary.availableBalance + request.adminChargeAmount),
            balanceAfter: summary.availableBalance,
            sourceId: request._id,
            sourceType: "WITHDRAWAL",
            description: `Permanent 5% admin charge of $${request.adminChargeAmount} debited for withdrawal`,
          },
        ],
        { session }
      );

      await session.commitTransaction();
      return request;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  walletTransfer: async ({ senderUserId, receiverMemberId, amount, note = "" }) => {
    if (amount <= 0) {
      throw new ApiError(400, "Transfer amount must be greater than zero.");
    }

    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      // 1. Validate sender is active
      const sender = await User.findById(senderUserId).session(session);
      if (!sender) throw new ApiError(404, "Sender user not found.");
      if (sender.status !== "active") {
        throw new ApiError(400, "Transfer blocked. Sender account is inactive.");
      }

      // 2. Locate and validate receiver
      let receiver = await User.findOne({
        memberId: String(receiverMemberId).trim().toUpperCase(),
      }).session(session);

      // Fallback: search by _id if memberId lookup fails (in case it is an ObjectId)
      if (!receiver && mongoose.Types.ObjectId.isValid(receiverMemberId)) {
        receiver = await User.findById(receiverMemberId).session(session);
      }

      if (!receiver) {
        throw new ApiError(404, `Receiver member "${receiverMemberId}" not found.`);
      }
      if (receiver.status !== "active") {
        throw new ApiError(400, `Receiver account is inactive.`);
      }
      if (String(sender._id) === String(receiver._id)) {
        throw new ApiError(400, "Cannot transfer funds to yourself.");
      }

      // 3. Lock/read summaries
      const senderSummary = await getOrCreateSummary(sender._id, session);
      const receiverSummary = await getOrCreateSummary(receiver._id, session);

      // 4. Validate available balance
      if (senderSummary.availableBalance - amount < 20) {
        throw new ApiError(
          400,
          `Transfer would bring remaining balance below the minimum limit of 20 USDT. Your current available balance is ${senderSummary.availableBalance} USDT.`
        );
      }

      // 5. Create WalletTransfer record
      const [transfer] = await WalletTransferModel.create(
        [
          {
            senderUserId: sender._id,
            receiverUserId: receiver._id,
            amount,
            status: "SUCCESS",
            senderBalanceAfter: round2(senderSummary.availableBalance - amount),
            receiverBalanceAfter: round2(receiverSummary.availableBalance + amount),
            note,
          },
        ],
        { session }
      );

      // 6. Update Sender
      senderSummary.walletTransferSentBalance = round2(senderSummary.walletTransferSentBalance + amount);
      senderSummary.lifetimeTransferredOut = round2(senderSummary.lifetimeTransferredOut + amount);
      recalculateBalances(senderSummary);
      await senderSummary.save({ session });

      // 7. Update Receiver
      receiverSummary.walletTransferReceivedBalance = round2(receiverSummary.walletTransferReceivedBalance + amount);
      receiverSummary.lifetimeTransferredIn = round2(receiverSummary.lifetimeTransferredIn + amount);
      recalculateBalances(receiverSummary);
      await receiverSummary.save({ session });

      // 8. Add Sender Ledger entry
      await WalletLedgerModel.create(
        [
          {
            userId: sender._id,
            type: "WALLET_TRANSFER_SENT",
            direction: "DEBIT",
            amount,
            balanceBefore: round2(senderSummary.availableBalance + amount),
            balanceAfter: senderSummary.availableBalance,
            sourceId: transfer._id,
            sourceType: "TRANSFER",
            description: `Sent $${amount} transfer to ${receiver.memberId} (${receiver.fullName})`,
          },
        ],
        { session }
      );

      // 9. Add Receiver Ledger entry
      await WalletLedgerModel.create(
        [
          {
            userId: receiver._id,
            type: "WALLET_TRANSFER_RECEIVED",
            direction: "CREDIT",
            amount,
            balanceBefore: round2(receiverSummary.availableBalance - amount),
            balanceAfter: receiverSummary.availableBalance,
            sourceId: transfer._id,
            sourceType: "TRANSFER",
            description: `Received $${amount} transfer from ${sender.memberId} (${sender.fullName})`,
          },
        ],
        { session }
      );

      await session.commitTransaction();
      return transfer;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  getWithdrawalHistory: async (userId, { page = 1, limit = 50 } = {}) => {
    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      WithdrawalRequestModel.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      WithdrawalRequestModel.countDocuments({ userId }),
    ]);

    return {
      history: docs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  getTransferHistory: async (userId, { page = 1, limit = 50 } = {}) => {
    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      WalletTransferModel.find({
        $or: [{ senderUserId: userId }, { receiverUserId: userId }],
      })
        .populate("senderUserId", "memberId fullName email")
        .populate("receiverUserId", "memberId fullName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      WalletTransferModel.countDocuments({
        $or: [{ senderUserId: userId }, { receiverUserId: userId }],
      }),
    ]);

    return {
      history: docs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  // ─── ADMIN SERVICES ────────────────────────────────────────────────────────

  getAdminWithdrawals: async ({ page = 1, limit = 50, status, userId, search } = {}) => {
    const skip = (page - 1) * limit;
    const query = {};
    if (status) query.status = status;
    if (userId) query.userId = userId;

    if (search) {
      const matchingUsers = await User.find({
        $or: [
          { fullName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { memberId: { $regex: search, $options: "i" } },
        ],
      }).select("_id").lean();
      
      const matchingUserIds = matchingUsers.map(u => u._id);
      query.$or = [
        { userId: { $in: matchingUserIds } },
        { walletAddress: { $regex: search, $options: "i" } },
      ];
    }

    const [docs, total] = await Promise.all([
      WithdrawalRequestModel.find(query)
        .populate("userId", "memberId fullName email")
        .populate("approvedBy", "fullName username")
        .populate("paidBy", "fullName username")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      WithdrawalRequestModel.countDocuments(query),
    ]);

    return {
      requests: docs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  getAdminWalletTransfers: async ({ page = 1, limit = 50, search } = {}) => {
    const skip = (page - 1) * limit;
    const query = {};

    if (search) {
      const matchingUsers = await User.find({
        $or: [
          { fullName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { memberId: { $regex: search, $options: "i" } },
        ],
      }).select("_id").lean();
      
      const matchingUserIds = matchingUsers.map(u => u._id);
      query.$or = [
        { senderUserId: { $in: matchingUserIds } },
        { receiverUserId: { $in: matchingUserIds } },
      ];
    }

    const [docs, total] = await Promise.all([
      WalletTransferModel.find(query)
        .populate("senderUserId", "memberId fullName email")
        .populate("receiverUserId", "memberId fullName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      WalletTransferModel.countDocuments(query),
    ]);

    return {
      transfers: docs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  // ─── INTEGRATION HOOKS ──────────────────────────────────────────────────────

  creditAutopoolWithdrawable: async (userId, amount, sourceEventId, session = null) => {
    const summary = await getOrCreateSummary(userId, session);
    summary.autopoolWithdrawableBalance = round2(summary.autopoolWithdrawableBalance + amount);
    recalculateBalances(summary);
    await summary.save({ session });

    await WalletLedgerModel.create(
      [
        {
          userId,
          type: "AUTOPOOL_WITHDRAWABLE_CREDIT",
          direction: "CREDIT",
          amount,
          balanceBefore: round2(summary.availableBalance - amount),
          balanceAfter: summary.availableBalance,
          sourceId: sourceEventId,
          sourceType: "AUTOPOOL",
          description: `Autopool level withdrawable credit of $${amount} from rebirth nodes (${sourceEventId})`,
        },
      ],
      { session }
    );
  },

  debitAliasDeduction: async (userId, amount, aliasId, session = null) => {
    const summary = await getOrCreateSummary(userId, session);
    summary.autopoolWithdrawableBalance = round2(summary.autopoolWithdrawableBalance - amount);
    recalculateBalances(summary);
    await summary.save({ session });

    await WalletLedgerModel.create(
      [
        {
          userId,
          type: "ALIAS_DEDUCTION",
          direction: "DEBIT",
          amount,
          balanceBefore: round2(summary.availableBalance + amount),
          balanceAfter: summary.availableBalance,
          sourceId: aliasId,
          sourceType: "ALIAS",
          description: `Upgrade alias account creation deduction of $${amount} for ID ${aliasId}`,
        },
      ],
      { session }
    );
  },

  creditSponsorIncome: async (userId, amount, sourceEventId, session = null) => {
    const summary = await getOrCreateSummary(userId, session);
    summary.sponsorIncomeBalance = round2(summary.sponsorIncomeBalance + amount);
    recalculateBalances(summary);
    await summary.save({ session });

    await WalletLedgerModel.create(
      [
        {
          userId,
          type: "SPONSOR_INCOME_CREDIT",
          direction: "CREDIT",
          amount,
          balanceBefore: round2(summary.availableBalance - amount),
          balanceAfter: summary.availableBalance,
          sourceId: sourceEventId,
          sourceType: "SPONSOR_INCOME",
          description: `Sponsor direct referral income credit of $${amount} from deposit ID ${sourceEventId}`,
        },
      ],
      { session }
    );
  },

  creditLevelIncome: async (userId, amount, sourceEventId, session = null) => {
    const summary = await getOrCreateSummary(userId, session);
    summary.levelIncomeBalance = round2(summary.levelIncomeBalance + amount);
    recalculateBalances(summary);
    await summary.save({ session });

    await WalletLedgerModel.create(
      [
        {
          userId,
          type: "LEVEL_INCOME_CREDIT",
          direction: "CREDIT",
          amount,
          balanceBefore: round2(summary.availableBalance - amount),
          balanceAfter: summary.availableBalance,
          sourceId: sourceEventId,
          sourceType: "LEVEL_INCOME",
          description: `Level income credit of $${amount} from deposit ID ${sourceEventId}`,
        },
      ],
      { session }
    );
  },

  adminAdjustmentCredit: async (userId, amount, reason = "WALLET_TESTING_SEED") => {
    if (amount <= 0) {
      throw new ApiError(400, "Adjustment credit must be greater than zero.");
    }
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const summary = await getOrCreateSummary(userId, session);
      summary.sponsorIncomeBalance = round2(summary.sponsorIncomeBalance + amount);
      recalculateBalances(summary);
      await summary.save({ session });

      await WalletLedgerModel.create(
        [
          {
            userId,
            type: "ADMIN_ADJUSTMENT",
            direction: "CREDIT",
            amount,
            balanceBefore: round2(summary.availableBalance - amount),
            balanceAfter: summary.availableBalance,
            sourceId: "ADJUSTMENT",
            sourceType: "ADMIN",
            description: reason,
          },
        ],
        { session }
      );

      await session.commitTransaction();
      return summary;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },
};
