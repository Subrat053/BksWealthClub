import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "../common/logger/logger.js";

export async function connectDatabase() {
  if (!env.MONGODB_URI) {
    logger.warn("MONGODB_URI not provided. Starting without database connection.");
    return;
  }

  await mongoose.connect(env.MONGODB_URI, {
    autoIndex: env.NODE_ENV !== "production",
  });

  logger.info("MongoDB connected");
}
