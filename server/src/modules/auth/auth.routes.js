import express from "express";
import * as authController from "./auth.controller.js";
import { protect, userOnly } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", authController.register);
router.post("/member-register", protect, userOnly, authController.memberRegister);
router.post("/login", authController.login);
router.post("/verify-email", authController.verifyEmail);
router.post("/resend-verification", authController.resendVerification);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

router.get("/me", protect, userOnly, authController.me);
router.patch("/profile", protect, userOnly, authController.updateProfile);
router.patch("/crypto-details", protect, userOnly, authController.updateCryptoDetails);

export default router;
