import mongoose from "mongoose";
import { User } from "../user/user.model.js";
import { AdminModel } from "../admin/admin.model.js";

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const normalizeId = (id) => {
  if (!id) return null;
  return isObjectId(id) ? new mongoose.Types.ObjectId(id) : id;
};

const buildReferralTree = async (parentId, level = 1) => {
  const queryId = normalizeId(parentId);

  const children = await User.find({
    referredByUserId: queryId,
    _id: { $ne: queryId }, // Prevent self-referral duplication/loops
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

const buildAdminRootChildren = async (adminSponsorId, level = 1) => {
  const children = await User.find({
    sponsorId: adminSponsorId,
    memberId: { $ne: adminSponsorId }, // Prevent root admin from being its own child
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
    const queryReferralId =
      req.query.referralId ||
      req.query.referredByUserId ||
      req.query.adminId ||
      req.query.userId ||
      null;

    const queryMemberId = req.query.memberId || req.query.sponsorId || null;

    let rootId =
      queryReferralId ||
      req.auth?.adminId ||
      req.admin?._id ||
      req.admin?.id ||
      null;

    const adminId = req.auth?.adminId;
    const admin = adminId
      ? await AdminModel.findById(adminId)
          .select("_id username email sponsorId role")
          .lean()
      : null;

    let root = null;

    if (queryMemberId) {
      root = await User.findOne({
        memberId: queryMemberId.trim().toUpperCase(),
      })
        .select("_id memberId fullName email status isActivated")
        .lean();

      if (!root) {
        return res.status(404).json({
          success: false,
          message: "No user found with this memberId.",
        });
      }

      rootId = root._id;
    }

    if (!rootId) {
      return res.status(400).json({
        success: false,
        message: "referralId, memberId, or admin token is required.",
      });
    }

    if (!root && !admin?.sponsorId) {
      return res.status(400).json({
        success: false,
        message: "Admin sponsorId is missing. Unable to build admin root tree.",
      });
    }

    const children = root
      ? await buildReferralTree(rootId, 1)
      : await buildAdminRootChildren(admin?.sponsorId, 1);

    return res.status(200).json({
      success: true,
      data: {
        root: {
          _id: root?._id || admin?._id || rootId,
          memberId: root?.memberId || admin?.sponsorId || req.auth?.memberId || "ADMIN001",
          fullName: root?.fullName || admin?.username || req.auth?.fullName || "Admin",
          email: root?.email || admin?.email || req.auth?.email || null,
          role: root ? "user" : admin?.role || "admin",
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

// PUBLIC: Validate sponsor ID during registration
export const validateSponsorId = async (req, res) => {
  try {
    const sponsorId = (req.body.sponsorId || req.query.sponsorId || "").trim();

    if (!sponsorId) {
      return res.status(400).json({
        success: false,
        message: "Sponsor ID is required.",
      });
    }

    // Look for user with matching memberId or admin with matching sponsorId
    const sponsor = await User.findOne({
      memberId: sponsorId.toUpperCase(),
    })
      .select("_id memberId fullName email status isActivated")
      .lean();

    if (sponsor) {
      return res.status(200).json({
        success: true,
        message: "Sponsor found.",
        data: {
          sponsorId: sponsor.memberId,
          sponsorName: sponsor.fullName,
          sponsorEmail: sponsor.email,
          isActivated: sponsor.isActivated,
          active: sponsor.status === "active" || sponsor.isActivated, // Add active for frontend
        },
      });
    }

    // If not a user, check if it's a valid admin sponsor ID
    const admin = await AdminModel.findOne({
      sponsorId: sponsorId.toUpperCase(),
    })
      .select("sponsorId username email")
      .lean();

    if (admin) {
      return res.status(200).json({
        success: true,
        message: "Sponsor (Admin) found.",
        data: {
          sponsorId: admin.sponsorId,
          sponsorName: admin.username,
          sponsorEmail: admin.email,
          isActivated: true,
          active: true, // Admin is always active
        },
      });
    }

    return res.status(404).json({
      success: false,
      message: "Sponsor not found. Please check the sponsor ID.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to validate sponsor ID.",
      error: error.message,
    });
  }
};
