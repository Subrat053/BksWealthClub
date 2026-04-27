import {
  adminLogin,
  getAllUsers,
  createUserByAdmin,
  requestUserInviteCode,
  verifyUserInviteCode,
  completeUserInvite,
  deleteUser,
  getUserDetails,
  updateUserStatus,
  resetUserPassword,
} from "./admin.controller.js";

import { Router } from "express";
import { protect, adminOnly } from "../../middleware/auth.middleware.js";

export const adminRouter = Router();

adminRouter.post("/login", adminLogin);

// All routes below require admin authentication
adminRouter.use(protect, adminOnly);

adminRouter.post("/users/invite/request-code", requestUserInviteCode);
adminRouter.post("/users/invite/verify-code", verifyUserInviteCode);
adminRouter.post("/users/invite/complete", completeUserInvite);

adminRouter.get("/users", getAllUsers);
adminRouter.post("/create-user", createUserByAdmin);
adminRouter.get("/users/:userId", getUserDetails);
adminRouter.patch("/users/:userId/status", updateUserStatus);
adminRouter.patch("/users/:userId/reset-password", resetUserPassword);
adminRouter.delete("/users/:userId", deleteUser);
