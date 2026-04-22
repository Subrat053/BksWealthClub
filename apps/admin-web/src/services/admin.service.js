const wait = () => new Promise((resolve) => setTimeout(resolve, 150));

export const adminService = {
  getDashboardSummary: async () => {
    await wait();
    return { users: 0, pendingDeposits: 0, pendingWithdrawals: 0, openTickets: 0 };
  },
  getUsers: async () => {
    await wait();
    return [];
  },
};
