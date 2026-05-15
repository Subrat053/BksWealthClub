import mongoose from "mongoose";
import { PoolFundLedger } from "./src/modules/autopool/pool-fund-ledger.model.js";
import { AutoPoolNode } from "./src/modules/autopool/autopool-matrix.model.js";
import { CompanyFund, CompanyFundEntry } from "./src/modules/autopool/company-fund.model.js";
import { User } from "./src/modules/user/user.model.js";
import { autopoolFundService } from "./src/modules/autopool/autopool-fund.service.js";
import dotenv from "dotenv";

dotenv.config();

async function repairLedger() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected to MongoDB");

  // 1. Repair Individual Rebirth Completions ($60 entries)
  console.log("\n🔍 Checking for missing rebirth completion ledger entries...");
  const completedNodes = await AutoPoolNode.find({ 
    status: "COMPLETED", 
    nodeType: "REBIRTH" 
  }).lean();

  let rebirthRepairCount = 0;
  for (const node of completedNodes) {
    const existing = await PoolFundLedger.findOne({
      completedRebirthId: node._id,
      type: "REBIRTH_AUTOPOOL_COMPLETED"
    });

    if (!existing) {
      console.log(`[Repair] Creating missing $60 ledger for node ${node.nodeCode}`);
      await PoolFundLedger.create({
        mainUserId: node.ownerUserId,
        completedRebirthId: node._id,
        level: node.levelNumber,
        type: "REBIRTH_AUTOPOOL_COMPLETED",
        amount: 60,
        childrenCount: 3,
        status: "COMPLETED"
      });
      rebirthRepairCount++;
    }
  }
  console.log(`✅ Fixed ${rebirthRepairCount} rebirth completion entries.`);

  // 2. Repair Level Completions and Distributions
  console.log("\n🔍 Checking for missing level completion distributions...");
  const users = await User.find({ status: "active" }).lean();
  
  let levelRepairCount = 0;
  for (const user of users) {
    // Check levels 0 to 5 (standard range)
    for (let level = 0; level <= 5; level++) {
      const requiredRebirths = Math.pow(2, level + 1);
      
      const completedInLedger = await PoolFundLedger.countDocuments({
        mainUserId: user._id,
        level: level,
        type: "REBIRTH_AUTOPOOL_COMPLETED"
      });

      if (completedInLedger >= requiredRebirths) {
        // All rebirths are completed in ledger, check if level distribution happened
        const levelDist = await PoolFundLedger.findOne({
          mainUserId: user._id,
          level: level,
          type: "LEVEL_AUTOPOOL_COMPLETED"
        });

        if (!levelDist) {
          console.log(`[Repair] User ${user.memberId} has completed Level ${level} but distribution is missing. Triggering...`);
          
          // We need a session-less version or we can just call it (the service uses sessions if provided)
          try {
            await autopoolFundService.processLevelDistribution(user._id, level);
            levelRepairCount++;
          } catch (err) {
            console.error(`❌ Error distributing Level ${level} for ${user.memberId}:`, err.message);
          }
        }
      }
    }
  }

  console.log(`✅ Triggered ${levelRepairCount} missing level distributions.`);
  console.log("\n✨ Repair process finished. All funds and stats should now be synced.");
  
  await mongoose.disconnect();
}

repairLedger();
