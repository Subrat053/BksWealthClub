import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import {
  getDirectTeamController,
  getGenerationTeamController,
  getHierarchyController,
} from "./team.controller.js";

export const teamRouter = Router();

teamRouter.use(authMiddleware);
teamRouter.get("/direct", getDirectTeamController);
teamRouter.get("/generation", getGenerationTeamController);
teamRouter.get("/hierarchy", getHierarchyController);
