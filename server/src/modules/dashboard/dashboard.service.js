import { buildReferralLink } from "../../utils/referral.js";
import { adminRepository } from "../admin/admin.repository.js";
import { auditService } from "../audit/audit.service.js";

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
    referralLink: buildReferralLink(
      process.env.BASE_URL || process.env.CLIENT_URL || "https://bkswealthclub.com",
      user?.memberId || "USER",
    ),
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

  getAdminSummary: async () => {
    const summary = await adminRepository.getSummary();
    const recentLogs = await auditService.list({}).limit(5);
    return {
      ...summary,
      recentActivities: recentLogs || [],
    };
  },
};
