import express from "express";
import * as authController from "./auth.controller.js";
import { protect } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/verify-email", authController.verifyEmail);
router.post("/resend-verification", authController.resendVerification);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

router.get("/me", protect, authController.me);
router.patch("/profile", protect, authController.updateProfile);
router.patch("/crypto-details", protect, authController.updateCryptoDetails);

export default router;
