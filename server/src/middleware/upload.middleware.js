import multer from "multer";
import { ApiError } from "../core/ApiError.js";

const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  const allowed = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new ApiError(400, "Unsupported file type"));
  }
  return cb(null, true);
};

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});
