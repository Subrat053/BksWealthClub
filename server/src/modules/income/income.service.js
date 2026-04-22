import { incomeRepository } from "./income.repository.js";

export const incomeService = {
  getSummary: async (userId) => {
    const [sponsorIncome, representativeIncome, autopoolIncome] = await Promise.all([
      incomeRepository.sumByType(userId, "sponsor"),
      incomeRepository.sumByType(userId, "representative"),
      incomeRepository.sumByType(userId, "autopool"),
    ]);

    return {
      sponsorIncome,
      representativeIncome,
      autopoolIncome,
      totalIncome: sponsorIncome + representativeIncome + autopoolIncome,
    };
  },

  getHistory: async (userId, query) => {
    const filter = {};
    if (query.type) filter.incomeType = query.type;
    return incomeRepository.getByUser(userId, filter);
  },

  createEntry: async (payload) => incomeRepository.createLedgerEntry(payload),
};
