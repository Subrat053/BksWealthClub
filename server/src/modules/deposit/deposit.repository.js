import { DepositModel } from "./deposit.model.js";

export const depositRepository = {
  create: async (payload) => DepositModel.create(payload),

  findById: async (id) => DepositModel.findById(id).lean(),

  getByUser: async (userRef) =>
    DepositModel.find({ userRef }).sort({ createdAt: -1 }).lean(),

  getPending: async () =>
    DepositModel.find({ status: "pending" })
      .populate("userRef", "memberId fullName email")
      .sort({ createdAt: 1 })
      .lean(),

  getAllForAdmin: async () =>
    DepositModel.find({})
      .populate("userRef", "memberId fullName email")
      .sort({ createdAt: -1 })
      .lean(),

  updateStatus: async (id, payload) =>
    DepositModel.findByIdAndUpdate(id, payload, { new: true }).lean(),
};
