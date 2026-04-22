import { ApiError } from "../core/ApiError.js";
import { USER_ROLES } from "../common/enums/index.js";

export function adminMiddleware(req, _res, next) {
  if (!req.user || ![USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN].includes(req.user.role)) {
    return next(new ApiError(403, "Admin access required"));
  }
  return next();
}
