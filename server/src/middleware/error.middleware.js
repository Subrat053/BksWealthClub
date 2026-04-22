import { ApiError } from "../core/ApiError.js";
import { ApiResponse } from "../core/ApiResponse.js";
import { logger } from "../common/logger/logger.js";

export function errorMiddleware(err, _req, res, _next) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json(
      new ApiResponse({
        success: false,
        message: err.message,
        data: err.details,
      }),
    );
  }

  logger.error(err);
  return res.status(500).json(new ApiResponse({ success: false, message: "Internal server error" }));
}
