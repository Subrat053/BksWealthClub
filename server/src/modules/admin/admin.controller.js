import { getAllUsers as getAllUsersService } from "./admin.service.js";
import bcrypt from "bcrypt";
import { User } from "../user/user.model.js";
import { AdminModel } from "./admin.model.js";
import { comparePassword } from "../../common/helpers/password.helper.js";
import { generateAccessToken } from "../../common/helpers/token.helper.js";
import { generateMemberId } from "../../utils/generateMemberId.js";
import { generateReferralCode } from "../../utils/generateReferralCode.js";
import { sendWelcomeEmail } from "../../common/service/email.service.js";


// 👁️ Get All Users
export const getAllUsers = async (req, res) => {
  try {
    const users = await getAllUsersService({
      status: req.query?.status,
      search: req.query?.search,
    });
    return res.status(200).json({
      success: true,
      users,
      count: users.length,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const adminLogin = async (req, res) => {
  try {
    const identifier = req.body?.identifier?.trim();
    const password = req.body?.password;

    if (!identifier || !password?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Identifier and password are required.",
      });
    }

    const normalizedIdentifier = identifier.toLowerCase();

    const admin = await AdminModel.findOne({
      $or: [
        { email: normalizedIdentifier },
        { username: identifier },
        { sponsorId: identifier.toUpperCase() },
      ],
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials.",
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: "Admin account is inactive.",
      });
    }

    const isPasswordValid = await comparePassword(password, admin.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials.",
      });
    }

    admin.lastLoginAt = new Date();
    await admin.save();

    const token = generateAccessToken({
      adminId: admin._id,
      role: admin.role,
      email: admin.email,
    });

    return res.status(200).json({
      success: true,
      message: "Admin login successful.",
      data: {
        token,
        admin: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          role: admin.role,
          sponsorId: admin.sponsorId,
          isActive: admin.isActive,
          lastLoginAt: admin.lastLoginAt,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};


// 👉 Create User (Admin)
export const createUserByAdmin = async (req, res) => {
  try {
    const { sponsorId, fullName, phone, email, password } = req.body;

    // Check existing email
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered." });
    }

    // Find sponsor (user or admin)
    const normalizedSponsorId = sponsorId?.trim().toUpperCase();
    if (!normalizedSponsorId) {
      return res.status(400).json({ message: "Sponsor ID is required." });
    }

    const sponsorUser = await User.findOne({ memberId: normalizedSponsorId });
    const sponsorAdmin = sponsorUser
      ? null
      : await AdminModel.findOne({ sponsorId: normalizedSponsorId, isActive: true });

    if (!sponsorUser && !sponsorAdmin) {
      return res.status(404).json({ message: "Sponsor not found." });
    }

    // Auto-generate memberId and referralCode (same as registerUser)
    const memberId = await generateMemberId();
    const referralCode = await generateReferralCode(fullName);
    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      memberId,
      sponsorId: normalizedSponsorId,
      sponsorUserId: sponsorUser?._id || null,
      referredByUserId: sponsorUser?._id || null,
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || null,
      passwordHash,
      referralCode,
      referralLink: `${process.env.BASE_URL}/register/${referralCode}`,
      registrationSource: "admin",
      status: "active",
      isActivated: true,
      isEmailVerified: true,
    });
    await sendWelcomeEmail(newUser.email, newUser.fullName, newUser.referralCode, password);
    return res.status(201).json({
      message: "User created successfully, Welcome mail sent.",
      data: newUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        status: "blocked",
        isSuspended: true,
      },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      success: true,
      message: "User banned successfully (soft delete).",
      data: user,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// 👁️ Get Single User Details
export const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .populate("sponsorUserId", "fullName email memberId")
      .populate("referredByUserId", "fullName email memberId");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// 🔄 Update User Status (Suspend / Activate / Block)
export const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    const allowedStatus = ["active", "inactive", "suspended", "blocked"];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        status,
        isSuspended: status === "blocked" || status === "suspended",
      },
      { new: true },
    );

    return res.json({
      message: "Status updated",
      user,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// 🔒 Reset User Password (Admin)
export const resetUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await User.findByIdAndUpdate(userId, { passwordHash });

    return res.json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
