import { User } from "../user/user.model.js";

// 👉 Get All Users
export const getAllUsers = async ({ status, search, type } = {}) => {
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

  if (type?.trim()) {
    const normalizedType = type.trim().toLowerCase();
    if (normalizedType === "alias") {
      query.isAliasAccount = true;
    } else if (normalizedType === "main") {
      query.isAliasAccount = { $ne: true };
    }
  }

  const users = await User.find(query)
    .select("-passwordHash -twoFactorSecret -twoFactorPendingSecret")
    .populate("sponsorUserId", "fullName memberId email")
    .populate("referredByUserId", "fullName memberId email")
    .sort({ createdAt: -1 });
  return users;
};
