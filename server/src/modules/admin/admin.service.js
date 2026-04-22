import { ApiError } from "../../core/ApiError.js";
import { adminRepository } from "./admin.repository.js";
import { auditService } from "../audit/audit.service.js";

export const adminService = {
  getSummary: async () => adminRepository.getSummary(),
  listUsers: async () => adminRepository.listUsers(),

  updateUserStatus: async ({ actorRef, userId, status, meta }) => {
    const updatedUser = await adminRepository.updateUserStatus(userId, status);
    if (!updatedUser) throw new ApiError(404, "User not found");

    await auditService.log({
      actorRef,
      actorRole: "admin",
      action: "update_user_status",
      module: "admin",
      targetRef: updatedUser._id,
      payloadSnapshot: { status },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return updatedUser;
  },
};
