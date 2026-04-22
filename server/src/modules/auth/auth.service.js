import bcrypt from "bcrypt";
import { ApiError } from "../../core/ApiError.js";
import { generateUsername } from "../../utils/generateUsername.js";
import { buildReferralLink } from "../../utils/referral.js";
import { signAccessToken, signRefreshToken } from "../../common/helpers/token.helper.js";
import { USER_ROLES } from "../../common/enums/index.js";
import { authRepository } from "./auth.repository.js";
import { referralService } from "../referral/referral.service.js";
import { userRepository } from "../user/user.repository.js";

export const authService = {
  validateSponsor: async (sponsorId) => {
    const sponsor = await referralService.findSponsorById(sponsorId);
    if (!sponsor) {
      throw new ApiError(404, "Sponsor not found");
    }

    return {
      sponsorId: sponsor.username,
      sponsorName: sponsor.name,
      sponsorStatus: sponsor.accountStatus,
      isActive: sponsor.accountStatus === "active",
    };
  },

  registerMember: async (payload) => {
    const sponsor = await referralService.findSponsorById(payload.sponsorId);
    if (!sponsor) {
      throw new ApiError(404, "Invalid sponsor ID");
    }

    const username = generateUsername();
    const referralCode = generateUsername("REF");
    const passwordHash = await bcrypt.hash(payload.password, 10);

    const user = await authRepository.createMember({
      name: payload.name,
      username,
      email: payload.email,
      country: payload.country,
      mobile: payload.mobile,
      passwordHash,
      sponsorId: sponsor.username,
      sponsorUserRef: sponsor._id,
      referralCode,
      referralLinkCode: referralCode,
      role: USER_ROLES.USER,
      accountStatus: "inactive",
      activationStatus: "pending",
    });

    await referralService.createReferralRelation({
      sponsorUserRef: sponsor._id,
      referredUserRef: user._id,
      level: 1,
      relationPath: [sponsor._id],
    });

    await userRepository.createWalletRecord({ userRef: user._id });

    return {
      id: user._id,
      username: user.username,
      referralLink: buildReferralLink("https://bkswealthclub.com", user.referralLinkCode),
      accountStatus: user.accountStatus,
      activationStatus: user.activationStatus,
    };
  },

  loginMember: async ({ identifier, password }) => {
    const user = await authRepository.findUserByIdentifier(identifier);
    if (!user) throw new ApiError(401, "Invalid credentials");

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) throw new ApiError(401, "Invalid credentials");

    const accessToken = signAccessToken({ sub: user._id, role: user.role, username: user.username });
    const refreshToken = signRefreshToken({ sub: user._id, role: user.role });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        accountStatus: user.accountStatus,
      },
    };
  },

  loginAdmin: async ({ identifier, password }) => {
    const admin = await authRepository.findAdminByIdentifier(identifier);
    if (!admin) throw new ApiError(401, "Invalid credentials");

    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isPasswordValid) throw new ApiError(401, "Invalid credentials");

    const accessToken = signAccessToken({ sub: admin._id, role: admin.role, username: admin.username });
    const refreshToken = signRefreshToken({ sub: admin._id, role: admin.role });

    return {
      accessToken,
      refreshToken,
      admin: {
        id: admin._id,
        username: admin.username,
        role: admin.role,
      },
    };
  },

  refreshTokens: async (_refreshToken) => {
    return {
      accessToken: signAccessToken({ sub: "placeholder", role: USER_ROLES.USER }),
      refreshToken: signRefreshToken({ sub: "placeholder", role: USER_ROLES.USER }),
    };
  },
};
