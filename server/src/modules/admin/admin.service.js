import { User } from "../user/user.model.js";

// 👉 Get All Users
export const getAllUsers = async ({ status, search } = {}) => {
  const query = {};

  if (status?.trim()) {
    const normalizedStatus = status.trim().toLowerCase();
    query.status =
      normalizedStatus === "approved" ? "active" : normalizedStatus;
  }

  if (search?.trim()) {
    const keyword = search.trim();
    const regex = new RegExp(keyword, "i");

    query.$or = [
      { fullName: regex },
      { email: regex },
      { memberId: regex },
      { phone: regex },
    ];
  }

  const users = await User.find(query).sort({ createdAt: -1 });
  return users;
};
