import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: './.env' });

const schema = new mongoose.Schema({}, { strict: false });
const ReferralTree = mongoose.model('ReferralTree', schema, 'referraltrees');
const User = mongoose.model('User', schema, 'users');

async function checkReferralTree() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const treeNodes = await ReferralTree.find({}).lean();
    console.log(`Found ${treeNodes.length} nodes in ReferralTree`);

    const users = await User.find({ _id: { $in: treeNodes.map(n => n.userId) } }).lean();
    const userMap = {};
    users.forEach(u => userMap[u._id.toString()] = u.memberId);

    const detailedNodes = treeNodes.map(n => ({
      _id: n._id,
      memberId: userMap[n.userId.toString()] || 'UNKNOWN',
      sponsorUserId: n.sponsorUserId,
      sponsorMemberId: n.sponsorUserId ? userMap[n.sponsorUserId.toString()] : 'NULL',
      referralLevel: n.referralLevel,
      referralPath: n.referralPath.map(id => userMap[id.toString()] || id)
    }));

    console.log(JSON.stringify(detailedNodes, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkReferralTree();
