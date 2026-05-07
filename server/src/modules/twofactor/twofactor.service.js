import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { ApiError } from "../../core/ApiError.js";
import { User } from "../user/user.model.js";

const APP_NAME = process.env.TOTP_APP_NAME || "BksWealthClub";

const getUserSafe = async (userId) => {
  const user = await User.findById(userId).select(
    "+twoFactorSecret +twoFactorPendingSecret email memberId fullName twoFactorEnabled twoFactorVerifiedAt",
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
};

const verifyTokenWithSecret = (secret, token) =>
  speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
    window: 1,
  });

export const twoFactorService = {
  setup: async (userId) => {
    const user = await getUserSafe(userId);

    const secret = speakeasy.generateSecret({
      name: `${APP_NAME}:${user.email || user.memberId}`,
      issuer: APP_NAME,
      length: 20,
    });

    user.twoFactorPendingSecret = secret.base32;
    await user.save();

    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

    return {
      qrCodeDataUrl,
      tempSecret: secret.base32,
      twoFactorEnabled: user.twoFactorEnabled,
    };
  },

  verifyAndEnable: async ({ userId, otp }) => {
    const user = await getUserSafe(userId);

    if (!user.twoFactorPendingSecret) {
      throw new ApiError(
        400,
        "2FA setup not initiated. Please run setup again.",
      );
    }

    const isValid = verifyTokenWithSecret(user.twoFactorPendingSecret, otp);

    if (!isValid) {
      throw new ApiError(
        400,
        "Invalid OTP. Please try again with current code.",
      );
    }

    user.twoFactorSecret = user.twoFactorPendingSecret;
    user.twoFactorPendingSecret = null;
    user.twoFactorEnabled = true;
    user.twoFactorVerifiedAt = new Date();
    await user.save();

    return {
      twoFactorEnabled: true,
      twoFactorVerifiedAt: user.twoFactorVerifiedAt,
    };
  },

  validate: async ({ userId, otp }) => {
    const user = await getUserSafe(userId);

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new ApiError(400, "2FA is not enabled for this user.");
    }

    const isValid = verifyTokenWithSecret(user.twoFactorSecret, otp);

    if (!isValid) {
      throw new ApiError(
        400,
        "Invalid OTP. Please try again with current code.",
      );
    }

    return {
      valid: true,
      twoFactorEnabled: true,
      validatedAt: new Date(),
    };
  },

  resetForUserByAdmin: async (userId) => {
    const user = await User.findById(userId).select("fullName email memberId");

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    await User.findByIdAndUpdate(userId, {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorPendingSecret: null,
      twoFactorVerifiedAt: null,
    });

    return {
      userId,
      memberId: user.memberId,
      email: user.email,
      fullName: user.fullName,
      twoFactorEnabled: false,
    };
  },
};
