import mongoose from "mongoose";
import { PoolFundLedger } from "./src/modules/autopool/pool-fund-ledger.model.js";
import { CompanyFund, CompanyFundEntry } from "./src/modules/autopool/company-fund.model.js";
import { User } from "./src/modules/user/user.model.js";
import dotenv from "dotenv";

dotenv.config();

async function repairLedger() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  // Find all LEVEL_AUTOPOOL_COMPLETED entries
  const levelCompletions = await PoolFundLedger.find({ type: "LEVEL_AUTOPOOL_COMPLETED" }).lean();
  console.log(`Found ${levelCompletions.length} level completions.`);

  for (const comp of levelCompletions) {
    console.log(`Checking distribution for User ${comp.mainUserId} Level ${comp.level}`);

    // Check if SPONSOR_DEDUCTION exists for this completion
    const existingDeduction = await PoolFundLedger.findOne({
      mainUserId: comp.mainUserId,
      level: comp.level,
      type: "SPONSOR_DEDUCTION"
    });

    if (!existingDeduction) {
      console.log("Missing deductions. Repairing...");
      
      const user = await User.findById(comp.mainUserId);
      const sponsorUserId = user?.referredByUserId;

      const rebirthCount = Math.pow(2, comp.level + 1);
      const nextLevelRebirthCount = rebirthCount * 2;
      const sponsorDeductionPerRebirth = 2.5;
      const companyDeductionPerRebirth = 2.5;

      if (sponsorUserId) {
        await PoolFundLedger.create({
          mainUserId: comp.mainUserId,
          sponsorUserId,
          level: comp.level,
          type: "SPONSOR_DEDUCTION",
          amount: sponsorDeductionPerRebirth * nextLevelRebirthCount,
          status: "COMPLETED",
          meta: { distributionLedgerId: comp._id, repaired: true }
        });
      }

      await PoolFundLedger.create({
        mainUserId: comp.mainUserId,
        level: comp.level,
        type: "COMPANY_FUND_DEDUCTION",
        amount: companyDeductionPerRebirth * nextLevelRebirthCount,
        status: "COMPLETED",
        meta: { distributionLedgerId: comp._id, repaired: true }
      });

      // Update Company Fund
      await CompanyFund.findOneAndUpdate(
        {},
        { $inc: { totalCompanyFund: companyDeductionPerRebirth * nextLevelRebirthCount } },
        { upsert: true }
      );
    } else {
      console.log("Deductions already exist.");
    }
  }

  console.log("Repair complete.");
  await mongoose.disconnect();
}

repairLedger();
