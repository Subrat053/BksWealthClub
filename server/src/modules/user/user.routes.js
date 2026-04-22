import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { changePasswordController, getProfileController, updateProfileController } from "./user.controller.js";
import { changePasswordSchema, updateProfileSchema } from "./user.validation.js";

export const userRouter = Router();

userRouter.use(authMiddleware);
userRouter.get("/me", getProfileController);
userRouter.patch("/me", validate(updateProfileSchema), updateProfileController);
userRouter.post("/me/change-password", validate(changePasswordSchema), changePasswordController);
