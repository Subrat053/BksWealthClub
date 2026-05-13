import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const schema = new mongoose.Schema({}, { strict: false });
const Node = mongoose.model('AutoPoolNode', schema, 'autopoolnodes');

async function repairMatrix() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const adminMemberId = "BKS000000";

    // 1. Reset ALL nodes except BKS000000 to PENDING
    // This allows the entire tree to be rebuilt in correct FIFO order under the Admin root.
    const result = await Node.updateMany(
      { 
        nodeCode: { $ne: adminMemberId }
      },
      { 
        $set: { 
          status: "PENDING",
          matrixParentId: null,
          parentNodeId: null,
          directChildren: [],
          directChildrenCount: 0,
          rebirthGenerated: false,
          rebirthGeneratedAt: null,
          completedAt: null
        } 
      }
    );

    console.log(`Reset ${result.modifiedCount} nodes to PENDING for reconstruction`);

    // 2. Ensure Admin is ROOT, PLACED, and has NO parents, but keep its current children for now (they will be overwritten or we clear them)
    // Actually, clear Admin children too so it starts fresh
    const adminResult = await Node.updateOne(
      { nodeCode: adminMemberId },
      { 
        $set: { 
          nodeType: "ROOT",
          status: "PLACED",
          matrixParentId: null,
          parentNodeId: null,
          directChildren: [],
          directChildrenCount: 0,
          isRoot: true,
          isOperationalRoot: true,
          queueTimestamp: new Date("2000-01-01T00:00:00Z"),
          rebirthGenerated: false,
          completedAt: null
        } 
      }
    );
    console.log('Operational Admin forced as ROOT');

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

repairMatrix();
