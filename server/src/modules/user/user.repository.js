import { UserModel } from "./user.model.js";
import { WalletModel } from "./wallet.model.js";

export const userRepository = {
  findById: async (id) => UserModel.findById(id).lean(),

  findByUsername: async (username) => UserModel.findOne({ username }).lean(),

  createWalletRecord: async (payload) => WalletModel.create(payload),

  updateProfile: async (id, payload) =>
    UserModel.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    }).lean(),

  getWalletSummary: async (userRef) => WalletModel.findOne({ userRef }).lean(),
};
