const wait = () => new Promise((resolve) => setTimeout(resolve, 150));

export const usersService = {
  getUserDetails: async (id) => {
    await wait();
    return { id, username: "GRW328370", status: "inactive" };
  },
  updateStatus: async (id, status) => {
    await wait();
    return { id, status };
  },
};
