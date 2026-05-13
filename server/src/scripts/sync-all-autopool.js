import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { DepositModel as Deposit } from '../modules/deposit/deposit.model.js';
import autopool3x3Service from '../modules/autopool/autopool-3x3.service.js';
import { AutoPoolNode } from '../modules/autopool/autopool-matrix.model.js';

dotenv.config({ path: './.env' });

async function syncAll() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const adminMemberId = "BKS000000";

    // 1. Reset all nodes (except ROOT) to PENDING to rebuild perfectly
    console.log('Resetting matrix for clean rebuild...');
    await AutoPoolNode.updateMany(
      { nodeCode: { $ne: adminMemberId } },
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

    // 2. Ensure ROOT is clean and available
    await AutoPoolNode.updateOne(
      { nodeCode: adminMemberId },
      { 
        $set: { 
          status: "PLACED",
          nodeType: "ROOT",
          isRoot: true,
          matrixParentId: null,
          parentNodeId: null,
          directChildren: [],
          directChildrenCount: 0,
          rebirthGenerated: false,
          completedAt: null,
          queueTimestamp: new Date("2000-01-01T00:00:00Z")
        } 
      }
    );

    // 2. Fetch all approved deposits
    const deposits = await Deposit.find({ status: "approved" });
    console.log(`Found ${deposits.length} approved deposits.`);

    // 3. Process each deposit (this ensures MAIN and INITIAL REBIRTHS exist)
    for (const dep of deposits) {
      console.log(`Processing deposit ${dep._id} for user ${dep.userRef}...`);
      
      // Reset processed flags to force re-sync
      dep.rebirthProcessed = false;
      dep.autoPoolProcessed = false;
      await dep.save();
      
      const result = await autopool3x3Service.processDepositSuccessForAutoPool(dep);
      console.log(`Synced: ${dep._id} -> Main: ${result.mainNodeId}`);
    }

    // 4. Run queue processing
    console.log('Processing AutoPool Queue...');
    const result = await autopool3x3Service.processAutoPoolQueue();
    console.log(`Rebuild complete. Placed ${result.placedCount} nodes.`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

syncAll();
