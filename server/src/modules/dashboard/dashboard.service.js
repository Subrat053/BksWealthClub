import { buildReferralLink } from "../../utils/referral.js";

export const dashboardService = {
  getMemberSummary: async ({ user }) => ({
    profile: {
      username: user?.username || "",
      joinDate: user?.joinDate || new Date(),
      activationDate: user?.activationDate || null,
      activePackage: 0,
    },
    incomes: {
      sponsorIncome: 0,
      representativeIncome: 0,
      totalIncome: 0,
    },
    referralLink: buildReferralLink("https://bkswealthclub.com", user?.username || "USER"),
    wallets: {
      mainWallet: 0,
      fundWallet: 0,
      holdingWallet: 0,
    },
    summary: {
      totalWithdrawal: 0,
      totalDeposit: 0,
      totalDirects: 0,
    },
  }),

  getAdminSummary: async () => ({
    users: 0,
    activeUsers: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    openSupportTickets: 0,
    totalIncomeProcessed: 0,
  }),
};
