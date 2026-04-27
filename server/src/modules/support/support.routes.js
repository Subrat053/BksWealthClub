import { Router } from "express";
import { protect, adminOnly } from "../../middleware/auth.middleware.js";
import {
  createTicket,
  getMyTickets,
  getAllTickets,
  replyTicket,
  getTicketById,
  updateTicketStatus,
} from "./support.controller.js";

export const supportRouter = Router();

supportRouter.post("/", protect, createTicket);
supportRouter.get("/my", protect, getMyTickets);
supportRouter.get("/admin/all", protect, adminOnly, getAllTickets);
supportRouter.get("/:id", protect, getTicketById);
supportRouter.post("/:id/reply", protect, replyTicket);
supportRouter.patch("/:id/status", protect, adminOnly, updateTicketStatus);
