import { Router } from "express";
import { protect, userOnly } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import {
  setupTwoFactorController,
  validateTwoFactorController,
  verifyTwoFactorController,
} from "./twofactor.controller.js";
import {
  validateTwoFactorSchema,
  verifyTwoFactorSchema,
} from "./twofactor.validation.js";

export const twoFactorRouter = Router();

twoFactorRouter.use(protect, userOnly);
twoFactorRouter.post("/setup", setupTwoFactorController);
twoFactorRouter.post(
  "/verify",
  validate(verifyTwoFactorSchema),
  verifyTwoFactorController,
);
twoFactorRouter.post(
  "/validate",
  validate(validateTwoFactorSchema),
  validateTwoFactorController,
);
