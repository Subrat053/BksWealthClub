import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { sponsorValidateSchema } from "../auth/auth.validation.js";
import { directStatsController, validateSponsorController } from "./referral.controller.js";

export const referralRouter = Router();

referralRouter.post("/validate-sponsor", validate(sponsorValidateSchema), validateSponsorController);
referralRouter.get("/direct-stats", authMiddleware, directStatsController);
