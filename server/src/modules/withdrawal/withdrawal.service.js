import { ApiError } from "../../core/ApiError.js";
import { calculateWithdrawal } from "../../utils/wallet.js";
import { settingsService } from "../settings/settings.service.js";
import { withdrawalRepository } from "./withdrawal.repository.js";

export const withdrawalService = {
  createRequest: async ({ userId, payload }) => {
    const rules = await settingsService.getPublicRules();
    const minAmount = Number(rules.withdrawalMinAmount || 10);

    if (payload.amount < minAmount) {
      throw new ApiError(400, `Minimum withdrawal amount is ${minAmount}`);
    }

    const chargePercent = Number(rules.withdrawalChargePercent || 0);
    const { charge, payable } = calculateWithdrawal({ amount: payload.amount, chargePercent });

    return withdrawalRepository.create({
      userRef: userId,
      amount: payload.amount,
      chargePercent,
      chargeAmount: charge,
      payableAmount: payable,
      walletAddress: payload.walletAddress,
      status: "pending",
    });
  },

  getMyHistory: async (userId) => withdrawalRepository.getByUser(userId),

  getPending: async () => withdrawalRepository.getPending(),

  approve: async ({ withdrawalId, adminId }) => {
    const updated = await withdrawalRepository.updateById(withdrawalId, {
      status: "approved",
      reviewedBy: adminId,
      reason: "",
    });
    if (!updated) throw new ApiError(404, "Withdrawal not found");
    return updated;
  },

  reject: async ({ withdrawalId, adminId, reason }) => {
    const updated = await withdrawalRepository.updateById(withdrawalId, {
      status: "rejected",
      reviewedBy: adminId,
      reason,
    });
    if (!updated) throw new ApiError(404, "Withdrawal not found");
    return updated;
  },
};
