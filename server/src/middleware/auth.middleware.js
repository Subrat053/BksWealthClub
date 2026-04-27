import { verifyAccessToken } from "../common/helpers/token.helper.js";

export const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    req.auth = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

export const adminOnly = (req, res, next) => {
  const role = req.auth?.role?.toLowerCase();
  if (role !== "admin" && role !== "superadmin") {
    return res.status(403).json({
      success: false,
      message: "Admin access only.",
    });
  }
  next();
};

export const userOnly = (req, res, next) => {
  const role = req.auth?.role?.toLowerCase();
  if (role !== "user") {
    return res.status(403).json({
      success: false,
      message: "User access only.",
    });
  }
  next();
};

export const authMiddleware = protect;
