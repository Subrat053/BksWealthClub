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
        err?.errorResponse?.errorLabels?.includes(
          "TransientTransactionError",
        ) ||
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

  getAllRequestsForAdmin: async () => depositRepository.getAllForAdmin(),

  approveRequest: async ({ depositId, adminId }) => {
    let shouldProcessAutoPoolQueue = false;

    const result = await withTransactionRetry(async (session) => {
      // ── 1. Atomic status lock ────────────────────────────────────────────────
      // Use findOneAndUpdate with { status: "pending", processingStatus: "PENDING" } as filter
      const deposit = await DepositModel.findOneAndUpdate(
        { _id: depositId, status: "pending", processingStatus: "PENDING" },
        {
          status: "approved",
          processingStatus: "PROCESSING",
          reviewedBy: adminId,
          reviewReason: "",
        },
        { new: true, session },
      );

      if (!deposit) {
        // Either doesn't exist OR was already approved/rejected by a concurrent request
        const existing =
          await DepositModel.findById(depositId).session(session);
        if (!existing) throw new ApiError(404, "Deposit request not found");
        if (existing.status === "approved" && existing.incomeDistributed) {
          // Fully processed already — return a safe response instead of 500
          return {
            deposit: existing,
            alreadyProcessed: true,
            message: "Deposit was already approved and income distributed.",
          };
        }
        throw new ApiError(
          400,
          "Deposit already processed or locked by another request",
        );
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
        if (!user.isActivated || !deposit.activationProcessed) {
          user.isActivated = true;
          user.isActive = true;
          user.status = "active";
          user.activationStatus = "ACTIVE";
          user.activatedAt = new Date();
          user.activatedByDepositId = deposit._id;
          await user.save({ session });
          deposit.activationProcessed = true;
        }

        if (!deposit.autoPoolProcessed || !deposit.rebirthProcessed) {
          try {
            activationResult = await autopoolService.activateMemberInAutopool(
              { userId: user._id, memberId: user.memberId },
              session,
            );
            deposit.autoPoolProcessed = true;
            deposit.rebirthProcessed = true;
            shouldProcessAutoPoolQueue = true;
          } catch (err) {
            if (err?.code === 11000) {
              console.warn("[Deposit] Autopool duplicate error details:", {
                code: err?.code,
                keyPattern: err?.keyPattern,
                keyValue: err?.keyValue,
                message: err?.message,
              });
              console.warn(
                `[Deposit] Autopool rebirth nodes already exist for ${user.memberId} — skipping creation`,
              );
              deposit.autoPoolProcessed = true;
              deposit.rebirthProcessed = true;
              shouldProcessAutoPoolQueue = true;
            } else {
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
          console.error(`[Deposit] Approval failed for ${user.memberId}:`, err);
          deposit.processingStatus = "FAILED";
          await deposit.save({ session });
          throw new ApiError(500, `Income distribution failed: ${err.message}`);
        }
      }

      deposit.processingStatus = "COMPLETED";
      await deposit.save({ session });

      const result = {
        deposit,
        activated: deposit.amount >= ACTIVATION_AMOUNT_USD && user.isActivated,
        autopool: activationResult,
        incomeDistribution: distributionResult,
        credited: deposit.amount,
      };

      return result;
    });

    if (shouldProcessAutoPoolQueue) {
      setImmediate(() => autopoolService.processAutopoolQueue());
    }

    return result;
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
