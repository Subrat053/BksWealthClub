import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../modules/user/user.model.js";
import { ReferralTree } from "../modules/referral/referral-tree.model.js";

dotenv.config({ path: "./.env" });

const ROOT_MEMBER_ID =
  process.env.OPERATIONAL_ADMIN_MEMBER_ID?.trim().toUpperCase() || "BKS000000";

async function buildTreeFromUser(user, level, pathIds, visited, nodes) {
  const userId = user._id.toString();
  if (visited.has(userId)) {
    return;
  }

  visited.add(userId);

  nodes.push({
    userId: user._id,
    sponsorUserId: pathIds.length ? pathIds[pathIds.length - 1] : null,
    referralLevel: level,
    referralPath: pathIds,
  });

  const children = await User.find({
    $or: [{ referredByUserId: user._id }, { sponsorUserId: user._id }],
  })
    .sort({ createdAt: 1 })
    .lean();

  for (const child of children) {
    await buildTreeFromUser(
      child,
      level + 1,
      [...pathIds, user._id],
      visited,
      nodes,
    );
  }
}

async function rebuildReferralTree() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  const rootUser = await User.findOne({ memberId: ROOT_MEMBER_ID }).lean();

  if (!rootUser) {
    throw new Error(`Root user ${ROOT_MEMBER_ID} not found`);
  }

  const visited = new Set();
  const nodes = [];

  await buildTreeFromUser(rootUser, 0, [], visited, nodes);

  await ReferralTree.deleteMany({});

  if (nodes.length > 0) {
    await ReferralTree.insertMany(nodes, { ordered: false });
  }

  console.log(
    `Rebuilt referral tree with ${nodes.length} nodes rooted at ${ROOT_MEMBER_ID}`,
  );
}

rebuildReferralTree()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
