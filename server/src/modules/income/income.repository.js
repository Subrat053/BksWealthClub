import { IncomeLedgerModel } from "./income.model.js";

export const incomeRepository = {
  createLedgerEntry: async (payload) => IncomeLedgerModel.create(payload),
  getByUser: async (userRef, filter = {}) => IncomeLedgerModel.find({ userRef, ...filter }).sort({ createdAt: -1 }).lean(),
  sumByType: async (userRef, incomeType) => {
    const rows = await IncomeLedgerModel.aggregate([
      { $match: { userRef, incomeType, entryType: "credit" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    return rows[0]?.total || 0;
  },
};
