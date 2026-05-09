import {
  adminLogin,
  getAllUsers,
  createUserByAdmin,
  requestUserInviteCode,
  verifyUserInviteCode,
  completeUserInvite,
  deleteUser,
  getUserDetails,
  resetUserTwoFactor,
  updateUserStatus,
  resetUserPassword,
  getUserPassword,
  sendVerificationLink,
  getAdminSummary,
} from "./admin.controller.js";

import { Router } from "express";
import { protect, adminOnly } from "../../middleware/auth.middleware.js";

export const adminRouter = Router();

adminRouter.post("/login", adminLogin);

// All routes below require admin authentication
adminRouter.use(protect, adminOnly);

adminRouter.get("/summary", getAdminSummary);

adminRouter.post("/users/invite/request-code", requestUserInviteCode);
adminRouter.post("/users/invite/verify-code", verifyUserInviteCode);
adminRouter.post("/users/invite/complete", completeUserInvite);

adminRouter.get("/users", getAllUsers);
adminRouter.post("/create-user", createUserByAdmin);
adminRouter.get("/users/:userId", getUserDetails);
adminRouter.get("/users/:userId/password", getUserPassword);
adminRouter.post("/users/:userId/send-verification-link", sendVerificationLink);
adminRouter.patch("/users/:userId/status", updateUserStatus);
adminRouter.patch("/users/:userId/reset-password", resetUserPassword);
adminRouter.post("/users/:userId/reset-2fa", resetUserTwoFactor);
adminRouter.delete("/users/:userId", deleteUser);
