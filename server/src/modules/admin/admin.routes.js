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

export const adminRouter = Router();

adminRouter.post("/login", adminLogin);
adminRouter.post("/users/invite/request-code", requestUserInviteCode);
adminRouter.post("/users/invite/verify-code", verifyUserInviteCode);
adminRouter.post("/users/invite/complete", completeUserInvite);

adminRouter.get("/users", getAllUsers);
// Create
adminRouter.post("/create-user", createUserByAdmin);

// Read
adminRouter.get("/users/:userId", getUserDetails);

// Update
adminRouter.patch("/users/:userId/status", updateUserStatus);
adminRouter.patch("/users/:userId/reset-password", resetUserPassword);

// Delete
adminRouter.delete("/users/:userId", deleteUser);
