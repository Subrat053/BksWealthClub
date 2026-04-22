import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { executeActivationController, requestActivationController } from "./activation.controller.js";

export const activationRouter = Router();

activationRouter.use(authMiddleware);
activationRouter.post("/request", requestActivationController);
activationRouter.post("/execute", executeActivationController);
