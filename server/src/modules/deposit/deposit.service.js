import { ApiError } from "../../core/ApiError.js";
import { depositRepository } from "./deposit.repository.js";

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
    const updated = await depositRepository.updateStatus(depositId, {
      status: "approved",
      reviewedBy: adminId,
      reviewReason: "",
    });
    if (!updated) throw new ApiError(404, "Deposit request not found");
    return updated;
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
