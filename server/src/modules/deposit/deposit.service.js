import mongoose from "mongoose";
import { ApiError } from "../../core/ApiError.js";
import { depositRepository } from "./deposit.repository.js";
import { DepositModel } from "./deposit.model.js";
import { autopoolService } from "../autopool/autopool.service.js";
import { User } from "../user/user.model.js";
import { WalletModel } from "../user/wallet.model.js";
import { ACTIVATION_AMOUNT_USD } from "../autopool/autopool.engine.js";
import { distributeDepositIncome } from "../income/incomeDistribution.service.js";

// ─── Retry helper for TransientTransactionError ────────────────────────────────
const MAX_RETRIES = 3;

async function withTransactionRetry(fn) {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction({
        readConcern: { level: "snapshot" },
        writeConcern: { w: "majority" },
      });
      const result = await fn(session);
      await session.commitTransaction();
      return result;
    } catch (err) {
      await session.abortTransaction().catch(() => {});
      lastErr = err;

      const isTransient =
        err?.errorLabels?.includes("TransientTransactionError") ||
        err?.errorResponse?.errorLabels?.includes("TransientTransactionError") ||
        err?.code === 112; // WriteConflict

      if (isTransient && attempt < MAX_RETRIES) {
        console.warn(
          `[Deposit] Transient transaction error (attempt ${attempt}/${MAX_RETRIES}), retrying…`,
        );
        await new Promise((r) => setTimeout(r, 100 * attempt)); // back-off
        continue;
      }
      throw err;
    } finally {
      session.endSession();
    }
  }
  throw lastErr;
}

export const depositService = {
  createRequest: async ({ userId, payload }) => {
    return depositRepository.create({
      userRef: userId,
      amount: payload.amount,
      walletType: payload.walletType,
      txHash: payload.txHash,
      proof: payload.proof || { url: "", publicId: "" },
    });
  },

  getMyHistory: async (userId) => depositRepository.getByUser(userId),

  getPendingRequests: async () => depositRepository.getPending(),

  approveRequest: async ({ depositId, adminId }) => {
    return withTransactionRetry(async (session) => {
      // ── 1. Atomic status lock ────────────────────────────────────────────────
      // Use findOneAndUpdate with { status: "pending" } as filter so only ONE
      // concurrent request wins. Any duplicate call sees a null result → 400.
      const deposit = await DepositModel.findOneAndUpdate(
        { _id: depositId, status: "pending" },
        { status: "approved", reviewedBy: adminId, reviewReason: "" },
        { new: true, session },
      );

      if (!deposit) {
        // Either doesn't exist OR was already approved/rejected by a concurrent request
        const existing = await DepositModel.findById(depositId).session(session);
        if (!existing) throw new ApiError(404, "Deposit request not found");
        if (existing.status === "approved" && existing.incomeDistributed) {
          // Fully processed already — return a safe response instead of 500
          return {
            deposit: existing,
            alreadyProcessed: true,
            message: "Deposit was already approved and income distributed.",
          };
        }
        throw new ApiError(400, "Deposit already processed or locked by another request");
      }

      // ── 2. Guard: income already distributed? ────────────────────────────────
      if (deposit.incomeDistributed) {
        return {
          deposit,
          alreadyProcessed: true,
          message: "Income already distributed for this deposit.",
        };
      }

      // ── 3. Fetch user ────────────────────────────────────────────────────────
      const user = await User.findById(deposit.userRef).session(session);
      if (!user) throw new ApiError(404, "User not found");

      // ── 4. Credit fund wallet ────────────────────────────────────────────────
      await WalletModel.findOneAndUpdate(
        { userRef: deposit.userRef },
        { $inc: { fundWallet: deposit.amount } },
        { upsert: true, session },
      );

      let activationResult = null;
      let distributionResult = null;

      if (deposit.amount >= ACTIVATION_AMOUNT_USD) {
        // ── 5. Autopool activation (ONLY if not already activated) ─────────────
        if (!user.isActivated) {
          try {
            // Pass session so autopool runs INSIDE this transaction (no nested session)
            activationResult = await autopoolService.activateMemberInAutopool(
              { userId: user._id, memberId: user.memberId },
              session,
            );
            user.isActivated = true;
            user.status = "active";
            await user.save({ session });
          } catch (err) {
            // Duplicate-key = already activated by a prior attempt; safe to continue
            if (err?.code === 11000) {
              console.warn(
                `[Deposit] Autopool nodes already exist for ${user.memberId} — skipping creation`,
              );
              // Ensure user flags are set
              await User.findByIdAndUpdate(
                user._id,
                { isActivated: true, status: "active" },
                { session },
              );
            } else {
              console.error(
                `[Deposit] Autopool activation failed for ${user.memberId}:`,
                err.message,
              );
              throw err;
            }
          }
        }

        // ── 6. Income Distribution ───────────────────────────────────────────
        try {
          distributionResult = await distributeDepositIncome({
            userId: user._id,
            depositId,
            session,
          });
          console.log(
            `[Deposit] Income distributed for ${user.memberId}: ` +
              `$${distributionResult.totalDistributed} across ${distributionResult.transactionCount} entries`,
          );
        } catch (err) {
          console.error(
            `[Deposit] Income distribution failed for ${user.memberId}:`,
            err.message,
          );
          throw new ApiError(500, "Income distribution failed: " + err.message);
        }
      }

      return {
        deposit,
        activated: deposit.amount >= ACTIVATION_AMOUNT_USD && user.isActivated,
        autopool: activationResult,
        incomeDistribution: distributionResult,
        credited: deposit.amount,
      };
    });
  },

  rejectRequest: async ({ depositId, adminId, reason }) => {
    const updated = await depositRepository.updateStatus(depositId, {
      status: "rejected",
      reviewedBy: adminId,
      reviewReason: reason || "Rejected by admin",
    });
    if (!updated) throw new ApiError(404, "Deposit request not found");
    return updated;
  },
};
