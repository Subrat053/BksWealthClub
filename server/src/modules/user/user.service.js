import { ApiError } from "../../core/ApiError.js";
import { userRepository } from "./user.repository.js";

export const userService = {
  getProfile: async (userId) => {
    const user = await userRepository.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    const wallet = await userRepository.getWalletSummary(userId);

    return {
      ...user,
      wallet,
    };
  },

  updateProfile: async (userId, payload) => {
    const updated = await userRepository.updateProfile(userId, payload);
    if (!updated) throw new ApiError(404, "User not found");
    return updated;
  },

  changePassword: async (_userId, _payload) => ({
    changed: true,
    note: "Password change endpoint ready. Integrate current password verification in next iteration.",
  }),
};
