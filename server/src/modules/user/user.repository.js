import { User } from "./user.model.js";
import { WalletModel } from "./wallet.model.js";

export const userRepository = {
  findById: async (id) => User.findById(id).lean(),

  findByUsername: async (username) => User.findOne({ username }).lean(),

  createWalletRecord: async (payload) => WalletModel.create(payload),

  updateProfile: async (id, payload) =>
    User.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    }).lean(),

  getWalletSummary: async (userRef) => WalletModel.findOne({ userRef }).lean(),
};
