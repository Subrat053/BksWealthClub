import mongoose from "mongoose";
import { User } from "../user/user.model.js";
import { AdminModel } from "../admin/admin.model.js";
import { referralService } from "./referral.service.js";

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const normalizeId = (id) => {
  if (!id) return null;
  return isObjectId(id) ? new mongoose.Types.ObjectId(id) : id;
};

const buildReferralTree = async (parentId, level = 1) => {
  const queryId = normalizeId(parentId);

  const children = await User.find({
    referredByUserId: queryId,
  })
    .select(
      "_id memberId fullName email phone status isActivated referredByUserId createdAt",
    )
    .sort({ createdAt: -1 })
    .lean();

  const result = [];

  for (const child of children) {
    const downlines = await buildReferralTree(child._id, level + 1);

    result.push({
      _id: child._id,
      memberId: child.memberId,
      fullName: child.fullName,
      email: child.email,
      phone: child.phone,
      status: child.status,
      isActivated: child.isActivated,
      referredByUserId: child.referredByUserId,
      joinedAt: child.createdAt,
      level,
      children: downlines,
    });
  }

  return result;
};

// Removed buildAdminRootChildren as we exclusively use buildReferralTree starting from User.

// USER SIDE: logged-in user's referrals
export const getMyReferrals = async (req, res) => {
  try {
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required.",
      });
    }

    const referrals = await User.find({
      referredByUserId: normalizeId(userId),
    })
      .select(
        "_id memberId fullName email phone status isActivated referredByUserId createdAt",
      )
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: referrals.length,
      data: referrals,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch my referrals.",
      error: error.message,
    });
  }
};

// USER SIDE: logged-in user's referral tree
export const getMyReferralTree = async (req, res) => {
  try {
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required.",
      });
    }

    const user = await User.findById(userId)
      .select("_id memberId fullName email status isActivated")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const children = await buildReferralTree(user._id, 1);

    return res.status(200).json({
      success: true,
      data: {
        root: {
          _id: user._id,
          memberId: user.memberId,
          fullName: user.fullName,
          email: user.email,
          status: user.status,
          isActivated: user.isActivated,
          role: "user",
          children,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch my referral tree.",
      error: error.message,
    });
  }
};

// ADMIN SIDE: fetch tree by query referral id/admin id/user id
// Example:
// /api/v1/referrals/admin/tree?referralId=69eb1ca05c5477227d9d9e164
// /api/v1/referrals/admin/tree?memberId=ADMIN001
// /api/v1/referrals/admin/tree?memberId=BWC145598
export const getAdminReferralTree = async (req, res) => {
  try {
    const queryMemberId = req.query.memberId || req.query.sponsorId || null;

    let root = null;
    let targetMemberId = queryMemberId ? queryMemberId.trim().toUpperCase() : "BKS000000";

    root = await User.findOne({
      memberId: targetMemberId,
    })
      .select("_id memberId fullName email status isActivated isOperationalAdmin")
      .lean();

    if (!root) {
      return res.status(404).json({
        success: false,
        message: "No user or Operational Admin found with this memberId.",
      });
    }

    const children = await buildReferralTree(root._id, 1);

    return res.status(200).json({
      success: true,
      data: {
        root: {
          _id: root._id,
          memberId: root.memberId,
          fullName: root.fullName,
          email: root.email,
          status: root.status,
          isActivated: root.isActivated,
          role: root.isOperationalAdmin ? "admin" : "user",
          children,
        },
      },
    });
  } catch (error) {
    console.log("ADMIN REFERRAL TREE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin referral tree.",
      error: error.message,
    });
  }
};

// ADMIN SIDE: flat report
export const getAdminReferralReport = async (req, res) => {
  try {
    const referrals = await User.find({
      referredByUserId: { $ne: null },
    })
      .populate("referredByUserId", "memberId fullName email")
      .select(
        "_id memberId fullName email phone status isActivated referredByUserId createdAt",
      )
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: referrals.length,
      data: referrals,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch referral report.",
      error: error.message,
    });
  }
};

export const validateSponsor = async (req, res) => {
  try {
    const sponsorId = String(req.body?.sponsorId || "").trim();
    if (!sponsorId) {
      return res.status(400).json({
        success: false,
        message: "Sponsor ID is required.",
      });
    }

    const result = await referralService.validateSponsor(sponsorId);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || "Sponsor validation failed.",
    });
  }
};
