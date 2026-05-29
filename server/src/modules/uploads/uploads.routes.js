import { Router } from "express";
import { authMiddleware, adminOnly } from "../../middleware/auth.middleware.js";
import { upload } from "../../middleware/upload.middleware.js";
import { uploadFileController } from "./uploads.controller.js";

export const uploadsRouter = Router();

uploadsRouter.post("/single", authMiddleware, adminOnly, upload.single("file"), uploadFileController);
