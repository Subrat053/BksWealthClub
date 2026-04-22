import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { adminMiddleware } from "../../middleware/admin.middleware.js";
import {
  createTicketController,
  getAllTicketsController,
  getMyTicketsController,
  replyTicketController,
} from "./support.controller.js";

export const supportRouter = Router();

supportRouter.use(authMiddleware);
supportRouter.post("/", createTicketController);
supportRouter.get("/mine", getMyTicketsController);
supportRouter.get("/admin/all", adminMiddleware, getAllTicketsController);
supportRouter.post("/admin/:id/reply", adminMiddleware, replyTicketController);
