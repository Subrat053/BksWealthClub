// controllers/support.controller.js
// const SupportTicket = require("../models/SupportTicket");
import { SupportTicket } from "./support.model.js";

export const createTicket = async (req, res) => {
  try {
    const { subject, category, priority, message } = req.body;
    const userId = req.auth.userId; 

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Subject and message are required.",
      });
    }

    const ticket = await SupportTicket.create({
      userId: req.auth.userId,
      subject,
      category,
      priority,
      replies: [
        {
          senderType: "user",
          senderId: userId,
          message,
        },
      ],
      lastReplyBy: "user",
    });

    res.status(201).json({
      success: true,
      message: "Support ticket created successfully.",
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ userId: req.auth.userId }).sort({
      updatedAt: -1,
    });

    res.json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllTickets = async (req, res) => {
  try {
    const { status, priority, category } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    const tickets = await SupportTicket.find(filter)
      .populate("userId", "name username email mobile")
      .sort({ updatedAt: -1 });

    res.json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTicketById = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id).populate(
      "userId",
      "name username email mobile"
    );

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found.",
      });
    }

    res.json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const replyTicket = async (req, res) => {
  try {
    const { message } = req.body;
    // const userId = req.user.userId;
    const senderId = req.auth.userId || req.auth.adminId;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Reply message is required.",
      });
    }

    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found.",
      });
    }

    const senderType = (req.auth.role === "admin" || req.auth.role === "superadmin") ? "admin" : "user";

    if (senderType === "user" && ticket.userId.toString() !== senderId) {
      return res.status(403).json({
        success: false,
        message: "You cannot reply to this ticket.",
      });
    }

    ticket.replies.push({
      senderType,
      senderId: senderId,
      message,
    });

    ticket.lastReplyBy = senderType;

    if (senderType === "user" && ticket.status === "Resolved") {
      ticket.status = "Open";
    }

    if (senderType === "admin" && ticket.status === "Open") {
      ticket.status = "In Progress";
    }

    await ticket.save();

    res.json({
      success: true,
      message: "Reply added successfully.",
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = ["Open", "In Progress", "Resolved", "Closed"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket status.",
      });
    }

    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found.",
      });
    }

    res.json({
      success: true,
      message: "Ticket status updated.",
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};