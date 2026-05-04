import speakeasy from "speakeasy";
import { ApiError } from "../core/ApiError.js";
import { User } from "../modules/user/user.model.js";

const getAuthUserId = (req) => req.auth?.userId || req.auth?.sub;

export const requireTwoFactorOtp = async (req, _res, next) => {
  try {
    const userId = getAuthUserId(req);

    if (!userId) {
      return next(new ApiError(401, "Unauthorized."));
    }

    const user = await User.findById(userId).select(
      "+twoFactorSecret twoFactorEnabled",
    );

    if (!user) {
      return next(new ApiError(404, "User not found."));
    }

    if (!user.twoFactorEnabled) {
      return next();
    }

    const otp =
      req.body?.otp || req.body?.twoFactorCode || req.headers["x-otp-code"];

    if (!otp || !/^\d{6}$/.test(String(otp).trim())) {
      return next(
        new ApiError(
          401,
          "OTP is required for this action when 2FA is enabled.",
        ),
      );
    }

    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: String(otp).trim(),
      window: 1,
    });

    if (!isValid) {
      return next(new ApiError(401, "Invalid OTP for sensitive action."));
    }

    // Prevent accidental OTP persistence when payload is forwarded.
    if (req.body?.otp) delete req.body.otp;
    if (req.body?.twoFactorCode) delete req.body.twoFactorCode;

    req.twoFactorValidated = true;
    return next();
  } catch (error) {
    return next(error);
  }
};
