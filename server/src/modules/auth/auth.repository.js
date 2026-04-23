import { User } from "../user/user.model.js";
import { AdminModel } from "../admin/admin.model.js";

export const authRepository = {
  findUserByIdentifier: async (identifier) => {
    const query = {
      isDeleted: false,
      $or: [
        { username: identifier.toUpperCase() },
        { email: identifier.toLowerCase() },
      ],
    };
    return User.findOne(query);
  },

  findAdminByIdentifier: async (identifier) => {
    const query = {
      $or: [{ username: identifier }, { email: identifier.toLowerCase() }],
    };
    return AdminModel.findOne(query);
  },

  createMember: async (payload) => User.create(payload),
};
