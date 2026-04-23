import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../../config/env.js";

export const generateAccessToken = (payload) => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
};

export const generateRandomToken = () => {
  return crypto.randomBytes(32).toString("hex");
};
