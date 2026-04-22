import { DepositModel } from "./deposit.model.js";

export const depositRepository = {
  create: async (payload) => DepositModel.create(payload),
  getByUser: async (userRef) => DepositModel.find({ userRef }).sort({ createdAt: -1 }).lean(),
  getPending: async () => DepositModel.find({ status: "pending" }).sort({ createdAt: -1 }).lean(),
  updateStatus: async (id, payload) => DepositModel.findByIdAndUpdate(id, payload, { new: true }).lean(),
};
