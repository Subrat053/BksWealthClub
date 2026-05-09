import { AdminModel } from "./admin.model.js";
import { User } from "../user/user.model.js";
import { DepositModel } from "../deposit/deposit.model.js";
import { WithdrawalModel } from "../withdrawal/withdrawal.model.js";
import { SupportTicketModel } from "../support/support.model.js";

const REAL_USER_FILTER = {
  // Keep compatibility with older docs that may have isDeleted, while
  // including current records where the field is absent.
  isDeleted: { $ne: true },
  // Exclude rebirth-style IDs from primary user counts.
  memberId: { $not: /-RB\d+$/i },
};

export const adminRepository = {
  getAdminById: async (id) => AdminModel.findById(id).lean(),
  listUsers: async () =>
    User.find(REAL_USER_FILTER).sort({ createdAt: -1 }).lean(),
  updateUserStatus: async (id, status) =>
    User.findByIdAndUpdate(id, { accountStatus: status }, { new: true }).lean(),
  getSummary: async () => {
    const [
      users,
      activeUsers,
      pendingDeposits,
      pendingWithdrawals,
      openTickets,
    ] = await Promise.all([
      User.countDocuments(REAL_USER_FILTER),
      User.countDocuments({ ...REAL_USER_FILTER, status: "active" }),
      DepositModel.countDocuments({ status: "pending" }),
      WithdrawalModel.countDocuments({ status: "pending" }),
      SupportTicketModel.countDocuments({
        status: { $in: ["Open", "In Progress", "open", "in_progress"] },
      }),
    ]);

    return {
      users,
      activeUsers,
      pendingDeposits,
      pendingWithdrawals,
      openTickets,
    };
  },
};
