import { ApiError } from "../../core/ApiError.js";
import { depositRepository } from "./deposit.repository.js";
import { autopoolService } from "../autopool/autopool.service.js";
import { User } from "../user/user.model.js";
import { WalletModel } from "../user/wallet.model.js";
import { ACTIVATION_AMOUNT_USD } from "../autopool/autopool.engine.js";

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

  /**
   * Admin approves a deposit.
   *
   * If the user is NOT yet activated AND the deposit amount >= $75:
   *   → Trigger full activation workflow (dual IDs, autopool placement)
   *
   * If user IS already activated (top-up deposit):
   *   → Just credit the wallet
   */
  approveRequest: async ({ depositId, adminId }) => {
    const deposit = await depositRepository.findById(depositId);
    if (!deposit) throw new ApiError(404, "Deposit request not found");
    if (deposit.status !== "pending")
      throw new ApiError(400, "Deposit already processed");

    // Mark deposit as approved
    const updated = await depositRepository.updateStatus(depositId, {
      status: "approved",
      reviewedBy: adminId,
      reviewReason: "",
    });

    const user = await User.findById(deposit.userRef).lean();
    if (!user) throw new ApiError(404, "User not found");

    // ── Activation flow (first-time $75 deposit) ─────────────────────────────
    if (!user.isActivated && deposit.amount >= ACTIVATION_AMOUNT_USD) {
      try {
        await autopoolService.activateMemberInAutopool({
          userId: user._id,
          memberId: user.memberId,
        });
      } catch (err) {
        console.error(
          `[Deposit] Autopool activation failed for ${user.memberId}:`,
          err.message,
        );
        // Don't throw — deposit is already approved; activation error is logged
      }
      return { deposit: updated, activated: true };
    }

    // ── Top-up deposit (user already active) ─────────────────────────────────
    await WalletModel.findOneAndUpdate(
      { userRef: deposit.userRef },
      { $inc: { fundWallet: deposit.amount } },
      { upsert: true },
    );

    return { deposit: updated, activated: false, credited: deposit.amount };
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
