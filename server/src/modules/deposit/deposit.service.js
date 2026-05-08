import mongoose from "mongoose";
import { ApiError } from "../../core/ApiError.js";
import { depositRepository } from "./deposit.repository.js";
import { DepositModel } from "./deposit.model.js";
import { autopoolService } from "../autopool/autopool.service.js";
import { User } from "../user/user.model.js";
import { WalletModel } from "../user/wallet.model.js";
import { ACTIVATION_AMOUNT_USD } from "../autopool/autopool.engine.js";
import { distributeDepositIncome } from "../income/incomeDistribution.service.js";

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
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const deposit = await DepositModel.findById(depositId).session(session);
      if (!deposit) throw new ApiError(404, "Deposit request not found");
      if (deposit.status !== "pending")
        throw new ApiError(400, "Deposit already processed");
      if (deposit.incomeDistributed)
        throw new ApiError(400, "Income already distributed for this deposit");

      // Mark deposit as approved
      deposit.status = "approved";
      deposit.reviewedBy = adminId;
      deposit.reviewReason = "";
      await deposit.save({ session });

      const user = await User.findById(deposit.userRef).session(session);
      if (!user) throw new ApiError(404, "User not found");

      // Credit the approved amount to the user's fund wallet first.
      await WalletModel.findOneAndUpdate(
        { userRef: deposit.userRef },
        { $inc: { fundWallet: deposit.amount } },
        { upsert: true, session },
      );

      let activationResult = null;
      let distributionResult = null;

      if (deposit.amount >= ACTIVATION_AMOUNT_USD) {
        // ── Activation flow ─────────────────────────────────────────────
        if (!user.isActivated) {
          try {
            activationResult = await autopoolService.activateMemberInAutopool(
              {
                userId: user._id,
                memberId: user.memberId,
              },
              session // note: if activateMemberInAutopool doesn't take session, it might run outside the transaction
            );
            user.isActivated = true;
            await user.save({ session });
          } catch (err) {
            console.error(
              `[Deposit] Autopool activation failed for ${user.memberId}:`,
              err.message,
            );
          }
        }

        // ── Income Distribution ─────────────────────────────────────────────────
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

      await session.commitTransaction();

      return {
        deposit,
        activated: deposit.amount >= ACTIVATION_AMOUNT_USD && user.isActivated,
        autopool: activationResult,
        incomeDistribution: distributionResult,
        credited: deposit.amount,
      };
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
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

