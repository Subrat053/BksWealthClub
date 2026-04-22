import { Router } from "express";
import { validate } from "../../middleware/validate.middleware.js";
import { authRateLimiter } from "../../middleware/rateLimit.middleware.js";
import {
  adminLoginController,
  forgotPasswordController,
  loginController,
  logoutController,
  refreshController,
  registerController,
  resetPasswordController,
  validateSponsorController,
} from "./auth.controller.js";
import { loginSchema, refreshSchema, registerSchema, sponsorValidateSchema } from "./auth.validation.js";

export const authRouter = Router();

authRouter.post("/validate-sponsor", validate(sponsorValidateSchema), validateSponsorController);
authRouter.post("/register", authRateLimiter, validate(registerSchema), registerController);
authRouter.post("/login", authRateLimiter, validate(loginSchema), loginController);
authRouter.post("/admin/login", authRateLimiter, validate(loginSchema), adminLoginController);
authRouter.post("/refresh", validate(refreshSchema), refreshController);
authRouter.post("/logout", logoutController);
authRouter.post("/forgot-password", forgotPasswordController);
authRouter.post("/reset-password", resetPasswordController);
