import { Router } from "express";
import { authMiddleware, adminOnly } from "../../middleware/auth.middleware.js";
import { getCommunityTreeController, placeMemberController } from "./autopool.controller.js";

export const autopoolRouter = Router();

autopoolRouter.get("/community-tree", authMiddleware, getCommunityTreeController);
autopoolRouter.post("/place", authMiddleware, adminOnly, placeMemberController);
