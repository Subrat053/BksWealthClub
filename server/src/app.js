import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env.js";
import { corsMiddleware } from "./config/cors.js";
import { apiRouter } from "./routes/index.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { ApiResponse } from "./core/ApiResponse.js";
// ===========================================
// ADMIN ROUTES
// ===========================================
import { adminRouter } from "./modules/admin/admin.routes.js";
import { supportRouter } from "./modules/support/support.routes.js";
// -------------------------------------------




export function createApp() {
  const app = express();

  app.disable("x-powered-by");

  app.use(helmet());
  app.use(corsMiddleware);
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use(cookieParser());
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

  app.get("/health", (_req, res) => {
    return res.status(200).json(
      new ApiResponse({
        success: true,
        message: "BksWealthClub server is healthy",
        data: {
          env: env.NODE_ENV,
          apiPrefix: env.API_PREFIX,
        },
      }),
    );
  });
// -------------------
  app.use("/admin", adminRouter);
  app.use("/support", supportRouter);
// -------------------
  app.use(env.API_PREFIX, apiRouter);

  app.use((_req, res) => {
    return res.status(404).json(
      new ApiResponse({
        success: false,
        message: "Route not found",
      }),
    );
  });

  app.use(errorMiddleware);

  return app;
}
