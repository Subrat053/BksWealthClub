import { getAllUsers as getAllUsersService } from "./admin.service.js";
import bcrypt from "bcrypt";
import { User } from "../user/user.model.js";

export const getAllUsers = async (req, res) => {
  try {
    const users = await getAllUsersService();
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// 👉 Create User (Admin)
export const createUserByAdmin = async (req, res) => {
  try {
    const {
      memberId,
      sponsorId,
      fullName,
      email,
      password,
    } = req.body;

    // Check existing
    const existingUser = await User.findOne({
      $or: [{ email }, { memberId }],
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Find sponsor user
    const sponsorUser = await User.findOne({ memberId: sponsorId });

    if (!sponsorUser) {
      return res.status(404).json({ message: "Sponsor not found" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    const referralCode = `BKW${Date.now()}`;

    const newUser = await User.create({
      memberId,
      sponsorId,
      sponsorUserId: sponsorUser._id,
      referredByUserId: sponsorUser._id,
      fullName,
      email,
      passwordHash,
      referralCode,
      referralLink: `${process.env.BASE_URL}/register/${referralCode}`,
      registrationSource: "admin",
      status: "active",
      isActivated: true,
      isEmailVerified: true,
    });

    return res.status(201).json({
      message: "User created successfully",
      data: newUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ message: "User deleted successfully" });
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
      { status },
      { new: true }
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
