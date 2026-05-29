import { DepositCredentialModel } from "./depositCredential.model.js";
import { ApiError } from "../../core/ApiError.js";

export const depositCredentialService = {
  getAll: async () => {
    return DepositCredentialModel.find().sort({ createdAt: -1 });
  },

  create: async (data) => {
    // If marked active, make all others inactive
    if (data.isActive) {
      await DepositCredentialModel.updateMany({}, { isActive: false });
    }
    return DepositCredentialModel.create(data);
  },

  update: async (id, data) => {
    const credential = await DepositCredentialModel.findById(id);
    if (!credential) throw new ApiError(404, "Deposit credential not found");

    credential.network = data.network;
    credential.walletAddress = data.walletAddress;
    if (data.qrCodeUrl) {
      credential.qrCodeUrl = data.qrCodeUrl;
    }
    credential.instructions = data.instructions;
    credential.updatedBy = data.updatedBy;

    if (data.isActive !== undefined && data.isActive !== credential.isActive) {
      credential.isActive = data.isActive;
      if (data.isActive) {
        await DepositCredentialModel.updateMany({ _id: { $ne: id } }, { isActive: false });
      }
    }

    return credential.save();
  },

  activate: async (id, adminId) => {
    const credential = await DepositCredentialModel.findById(id);
    if (!credential) throw new ApiError(404, "Deposit credential not found");

    // Make all others inactive
    await DepositCredentialModel.updateMany({ _id: { $ne: id } }, { isActive: false });

    credential.isActive = true;
    credential.updatedBy = adminId;
    return credential.save();
  },

  getActive: async () => {
    const credential = await DepositCredentialModel.findOne({ isActive: true });
    if (!credential) {
      return null;
    }
    return credential;
  },
};
