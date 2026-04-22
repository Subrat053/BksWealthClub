import { ApiResponse } from "../../core/ApiResponse.js";
import { asyncHandler } from "../../core/asyncHandler.js";
import { supportService } from "./support.service.js";

export const createTicketController = asyncHandler(async (req, res) => {
  const data = await supportService.createTicket({ userId: req.user.sub, payload: req.body });
  res.status(201).json(new ApiResponse({ message: "Support ticket created", data }));
});

export const getMyTicketsController = asyncHandler(async (req, res) => {
  const data = await supportService.getMyTickets(req.user.sub);
  res.json(new ApiResponse({ message: "Support history fetched", data }));
});

export const getAllTicketsController = asyncHandler(async (_req, res) => {
  const data = await supportService.getAllTickets();
  res.json(new ApiResponse({ message: "All support tickets fetched", data }));
});

export const replyTicketController = asyncHandler(async (req, res) => {
  const data = await supportService.replyToTicket({
    ticketId: req.params.id,
    adminId: req.user.sub,
    message: req.body.message,
  });
  res.json(new ApiResponse({ message: "Support reply sent", data }));
});
