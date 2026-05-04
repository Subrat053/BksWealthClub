import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { requireTwoFactorOtp } from "../../middleware/twofactor.middleware.js";
import {
  executeActivationController,
  requestActivationController,
} from "./activation.controller.js";

export const activationRouter = Router();

activationRouter.use(authMiddleware);
activationRouter.post(
  "/request",
  requireTwoFactorOtp,
  requestActivationController,
);
activationRouter.post(
  "/execute",
  requireTwoFactorOtp,
  executeActivationController,
);
