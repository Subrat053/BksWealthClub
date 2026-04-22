import dotenv from "dotenv";

dotenv.config();

const requiredInProduction = ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"];

for (const key of requiredInProduction) {
  if (process.env.NODE_ENV === "production" && !process.env[key]) {
    throw new Error(`Missing required env variable: ${key}`);
  }
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 5000),
  API_PREFIX: process.env.API_PREFIX || "/api/v1",
  MONGODB_URI: process.env.MONGODB_URI || "",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  ADMIN_URL: process.env.ADMIN_URL || "http://localhost:5174",
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "access-dev-secret",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "refresh-dev-secret",
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  COOKIE_SECURE: process.env.COOKIE_SECURE === "true",
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || "",
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",
  REDIS_URL: process.env.REDIS_URL || "",
};
