import { UserModel } from "../user/user.model.js";
import { AdminModel } from "../admin/admin.model.js";
import { AuthSessionModel } from "./auth.model.js";

export const authRepository = {
  findUserByIdentifier: async (identifier) => {
    const query = {
      isDeleted: false,
      $or: [{ username: identifier.toUpperCase() }, { email: identifier.toLowerCase() }],
    };
    return UserModel.findOne(query);
  },

  findAdminByIdentifier: async (identifier) => {
    const query = { $or: [{ username: identifier }, { email: identifier.toLowerCase() }] };
    return AdminModel.findOne(query);
  },

  createMember: async (payload) => UserModel.create(payload),

  saveSession: async (payload) => AuthSessionModel.create(payload),

  invalidateSession: async (sessionId) => AuthSessionModel.findByIdAndDelete(sessionId),
};
