import { AdminModel } from "./admin.model.js";
import { UserModel } from "../user/user.model.js";
import { DepositModel } from "../deposit/deposit.model.js";
import { WithdrawalModel } from "../withdrawal/withdrawal.model.js";
import { SupportTicketModel } from "../support/support.model.js";

export const adminRepository = {
  getAdminById: async (id) => AdminModel.findById(id).lean(),
  listUsers: async () => UserModel.find({ isDeleted: false }).sort({ createdAt: -1 }).lean(),
  updateUserStatus: async (id, status) => UserModel.findByIdAndUpdate(id, { accountStatus: status }, { new: true }).lean(),
  getSummary: async () => {
    const [users, pendingDeposits, pendingWithdrawals, openTickets] = await Promise.all([
      UserModel.countDocuments({ isDeleted: false }),
      DepositModel.countDocuments({ status: "pending" }),
      WithdrawalModel.countDocuments({ status: "pending" }),
      SupportTicketModel.countDocuments({ status: { $in: ["open", "in_progress"] } }),
    ]);

    return { users, pendingDeposits, pendingWithdrawals, openTickets };
  },
};
