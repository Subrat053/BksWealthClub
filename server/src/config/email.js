import "./env.js";
import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,       // e.g. smtp.gmail.com
  port: Number(process.env.MAIL_PORT) || 587,
  secure: process.env.MAIL_SECURE === "true" || Number(process.env.MAIL_PORT) === 465,
  requireTLS: Number(process.env.MAIL_PORT) === 587,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,      // Gmail: use App Password
  },
});