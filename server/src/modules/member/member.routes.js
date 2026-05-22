import { Router } from "express";
import { authMiddleware, userOnly } from "../../middleware/auth.middleware.js";
import {
  getMemberAliasesController,
  getMemberAliasAutopoolController,
  getMemberAliasTreeController,
} from "../user/user.controller.js";

export const memberRouter = Router();

memberRouter.use(authMiddleware, userOnly);
memberRouter.get("/aliases", getMemberAliasesController);
memberRouter.get("/aliases/:aliasMemberId/autopool", getMemberAliasAutopoolController);
memberRouter.get("/aliases/:aliasMemberId/tree", getMemberAliasTreeController);

export default memberRouter;