import { User } from "../user/user.model.js";
import { UserProfile } from "../user/user-profile.model.js";
import { AdminModel } from "../admin/admin.model.js";
import { EmailVerification, PasswordReset } from "./auth.model.js";
import {
  hashPassword,
  comparePassword,
} from "../../common/helpers/password.helper.js";
import { sendVerificationEmail } from "../../common/service/email.service.js";
import {
  generateAccessToken,
  generateRandomToken,
} from "../../common/helpers/token.helper.js";
import { generateMemberId } from "../../utils/generateMemberId.js";
import { generateReferralCode } from "../../utils/generateReferralCode.js";

const buildReferralLink = (referralCode) => {
  return `${process.env.CLIENT_URL}/register?ref=${referralCode}`;
};

const findUserByLoginIdentifier = async (identifier) => {
  const normalized = identifier.trim().toLowerCase();

  return User.findOne({
    $or: [
      { email: normalized },
      { memberId: identifier.trim() },
      { bepAddress: identifier.trim() },
    ],
  });
};

export const registerUser = async (payload) => {
  const {
    fullName,
    email,
    phone,
    password,
    sponsorId,
    registrationSource,
    bepAddress,
  } = payload;

  const existingEmail = await User.findOne({ email: email.toLowerCase() });
  if (existingEmail) {
    throw new Error("Email already registered.");
  }

  const normalizedSponsorId = sponsorId?.trim().toUpperCase();
  if (!normalizedSponsorId) {
    throw new Error("Sponsor ID is required.");
  }

  const sponsorUser = await User.findOne({ memberId: normalizedSponsorId });
  const sponsorAdmin = sponsorUser
    ? null
    : await AdminModel.findOne({
        sponsorId: normalizedSponsorId,
        isActive: true,
      });

  if (!sponsorUser && !sponsorAdmin) {
    throw new Error("Sponsor ID not found.");
  }

  const memberId = await generateMemberId();
  const referralCode = await generateReferralCode(fullName);
  const passwordHash = await hashPassword(password);

  const user = await User.create({
    memberId,
    sponsorId: normalizedSponsorId,
    sponsorUserId: sponsorUser?._id || null,
    referredByUserId: sponsorUser?._id || null,
    fullName: fullName.trim(),
    email: email.toLowerCase().trim(),
    phone: phone?.trim() || null,
    passwordHash,
    bepAddress: bepAddress?.trim() || null,
    referralCode,
    referralLink: buildReferralLink(referralCode),
    registrationSource,
    status: "pending",
    isEmailVerified: false,
    isActivated: false,
  });

  await UserProfile.create({
    userId: user._id,
  });

  const verifyToken = generateRandomToken();

  await EmailVerification.create({
    userId: user._id,
    email: user.email,
    token: verifyToken,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
  });

  await sendVerificationEmail(user.email, user.fullName, verifyToken);

  return {
    user,
    verifyToken,
  };
};

export const loginUser = async ({ identifier, password }) => {
  const user = await findUserByLoginIdentifier(identifier);

  if (!user) {
    throw new Error("Invalid credentials.");
  }

  if (
    user.isSuspended ||
    user.status === "suspended" ||
    user.status === "blocked"
  ) {
    throw new Error("Account is suspended or blocked.");
  }

  const isPasswordValid = await comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new Error("Invalid credentials.");
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = generateAccessToken({
    userId: user._id,
    memberId: user.memberId,
    role: "member",
  });

  return { user, token };
};

export const verifyUserEmail = async (token) => {
  const verification = await EmailVerification.findOne({
    token,
    isUsed: false,
  });

  if (!verification) {
    throw new Error("Invalid verification token.");
  }

  if (verification.expiresAt < new Date()) {
    throw new Error("Verification token expired.");
  }

  await User.findByIdAndUpdate(verification.userId, {
    isEmailVerified: true,
  });

  verification.isUsed = true;
  await verification.save();

  return true;
};

export const resendVerificationEmail = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) throw new Error("User not found.");

  if (user.isEmailVerified) {
    throw new Error("Email already verified.");
  }

  const verifyToken = generateRandomToken();

  await EmailVerification.create({
    userId: user._id,
    email: user.email,
    token: verifyToken,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
  });

  return { verifyToken };
};

export const forgotPassword = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) throw new Error("User not found.");

  const token = generateRandomToken();

  await PasswordReset.create({
    userId: user._id,
    token,
    expiresAt: new Date(Date.now() + 1000 * 60 * 30),
  });

  return { token };
};

export const resetPassword = async ({ token, newPassword }) => {
  const reset = await PasswordReset.findOne({ token, isUsed: false });
  if (!reset) throw new Error("Invalid reset token.");

  if (reset.expiresAt < new Date()) {
    throw new Error("Reset token expired.");
  }

  const passwordHash = await hashPassword(newPassword);

  await User.findByIdAndUpdate(reset.userId, { passwordHash });

  reset.isUsed = true;
  await reset.save();

  return true;
};

export const getMyProfile = async (userId) => {
  const user = await User.findById(userId).select("-passwordHash");
  const profile = await UserProfile.findOne({ userId });

  return { user, profile };
};

export const updateMyProfile = async (userId, payload) => {
  const { fullName, phone } = payload;

  const user = await User.findByIdAndUpdate(
    userId,
    {
      fullName,
      phone,
    },
    { new: true },
  ).select("-passwordHash");

  const profile = await UserProfile.findOneAndUpdate(
    { userId },
    {
      fatherName: payload.fatherName || null,
      dob: payload.dob || null,
      gender: payload.gender || null,
      addressLine1: payload.addressLine1 || null,
      addressLine2: payload.addressLine2 || null,
      city: payload.city || null,
      state: payload.state || null,
      postalCode: payload.postalCode || null,
      country: payload.country || null,
    },
    { new: true, upsert: true },
  );

  return { user, profile };
};

export const updateCryptoDetails = async (userId, payload) => {
  const profile = await UserProfile.findOneAndUpdate(
    { userId },
    {
      $set: {
        "crypto.bep20WalletAddress": payload.bep20WalletAddress || null,
        "crypto.trc20WalletAddress": payload.trc20WalletAddress || null,
        "crypto.preferredNetwork": payload.preferredNetwork || null,
      },
    },
    { new: true, upsert: true },
  );

  return profile;
};
