import * as authService from "./auth.service.js";
import {
  validateLoginInput,
  validateRegisterInput,
} from "./auth.validation.js";

export const register = async (req, res) => {
  try {
    const errors = validateRegisterInput(req.body);
    if (errors.length) {
      return res
        .status(400)
        .json({ success: false, message: errors[0], errors });
    }

    const result = await authService.registerUser(req.body);

    return res.status(201).json({
      success: true,
      message: "Registration successful. Please verify your email.",
      data: {
        memberId: result.user.memberId,
        email: result.user.email,
        referralCode: result.user.referralCode,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const errors = validateLoginInput(req.body);
    if (errors.length) {
      return res
        .status(400)
        .json({ success: false, message: errors[0], errors });
    }

    const result = await authService.loginUser(req.body);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    await authService.verifyUserEmail(req.body.token);

    return res.status(200).json({
      success: true,
      message: "Email verified successfully.",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const resendVerification = async (req, res) => {
  try {
    await authService.resendVerificationEmail(req.body.email);

    return res.status(200).json({
      success: true,
      message: "Verification email resent successfully.",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    await authService.forgotPassword(req.body.email);

    return res.status(200).json({
      success: true,
      message: "Password reset link generated.",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    await authService.resetPassword(req.body);

    return res.status(200).json({
      success: true,
      message: "Password reset successful.",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const me = async (req, res) => {
  try {
    const result = await authService.getMyProfile(req.user.userId);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const result = await authService.updateMyProfile(req.user.userId, req.body);

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateCryptoDetails = async (req, res) => {
  try {
    const result = await authService.updateCryptoDetails(
      req.user.userId,
      req.body,
    );

    return res.status(200).json({
      success: true,
      message: "Crypto details updated successfully.",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
