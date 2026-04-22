import { WithdrawalModel } from "./withdrawal.model.js";

export const withdrawalRepository = {
  create: async (payload) => WithdrawalModel.create(payload),
  getByUser: async (userRef) => WithdrawalModel.find({ userRef }).sort({ createdAt: -1 }).lean(),
  getPending: async () => WithdrawalModel.find({ status: "pending" }).sort({ createdAt: -1 }).lean(),
  updateById: async (id, payload) => WithdrawalModel.findByIdAndUpdate(id, payload, { new: true }).lean(),
};
