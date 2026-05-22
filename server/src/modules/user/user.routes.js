import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { requireTwoFactorOtp } from "../../middleware/twofactor.middleware.js";
import {
  changePasswordController,
  getProfileController,
  getMyAliasesController,
  getAliasDetailsController,
  updateProfileController,
} from "./user.controller.js";
import {
  changePasswordSchema,
  updateProfileSchema,
} from "./user.validation.js";
import { userOnly } from "../../middleware/auth.middleware.js";

export const userRouter = Router();

userRouter.use(authMiddleware, userOnly);
userRouter.get("/me", getProfileController);
userRouter.get("/my-aliases", getMyAliasesController);
userRouter.get("/alias/:aliasMemberId", getAliasDetailsController);
userRouter.patch(
  "/me",
  requireTwoFactorOtp,
  validate(updateProfileSchema),
  updateProfileController,
);
userRouter.post(
  "/me/change-password",
  requireTwoFactorOtp,
  validate(changePasswordSchema),
  changePasswordController,
);
