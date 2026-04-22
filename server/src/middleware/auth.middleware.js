import { ApiError } from "../core/ApiError.js";
import { verifyAccessToken } from "../common/helpers/token.helper.js";

export function authMiddleware(req, _res, next) {
  const authHeader = req.headers.authorization || "";
  const tokenFromHeader = authHeader.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : null;
  const token = tokenFromHeader || req.cookies?.accessToken;

  if (!token) {
    return next(new ApiError(401, "Authentication required"));
  }

  try {
    req.user = verifyAccessToken(token);
    return next();
  } catch {
    return next(new ApiError(401, "Invalid or expired token"));
  }
}
