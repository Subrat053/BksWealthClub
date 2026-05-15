import mongoose from "mongoose";
import { PoolFundLedger } from "./pool-fund-ledger.model.js";
import { CompanyFund, CompanyFundEntry } from "./company-fund.model.js";
import { AutoPoolNode } from "./autopool-matrix.model.js";
import { User } from "../user/user.model.js";
import { WalletModel as Wallet } from "../user/wallet.model.js";
import { IncomeLedgerModel as Income } from "../income/income.model.js";

/**
 * AutoPool Fund Service
 * Handles calculations and ledger entries for AutoPool financial flow.
 */
export const autopoolFundService = {
  /**
   * Process a single rebirth completion payout ($60 gross)
   */
  processRebirthCompletionFund: async (nodeId, session) => {
    const node = await AutoPoolNode.findById(nodeId).session(session);
    if (!node || node.nodeType !== "REBIRTH") return;

    // 1. Confirm children count is exactly 3
    if (node.directChildrenCount !== 3) {
      console.warn(`[AutoPoolFund] Node ${node.nodeCode} completion ignored: children count ${node.directChildrenCount} != 3`);
      return;
    }

    // 2. Prevent duplicate payout for the same rebirth ID
    const existing = await PoolFundLedger.findOne({
      completedRebirthId: node._id,
      type: "REBIRTH_AUTOPOOL_COMPLETED",
    }).session(session);

    if (existing) {
      console.log(`[AutoPoolFund] Rebirth ${node.nodeCode} already has completion ledger, skipping.`);
      return;
    }

    // 3. Create REBIRTH_AUTOPOOL_COMPLETED ledger entry ($60)
    await PoolFundLedger.create(
      [
        {
          mainUserId: node.ownerUserId,
          completedRebirthId: node._id,
          level: node.levelNumber,
          type: "REBIRTH_AUTOPOOL_COMPLETED",
          amount: 60,
          childrenCount: 3,
          status: "COMPLETED",
        },
      ],
      { session }
    );

    console.log(`[AutoPoolFund] Created $60 completion ledger for rebirth ${node.nodeCode}`);
  },

  /**
   * Process full level distribution for a user
   * Triggered when all rebirths of a specific level for a user are completed.
   */
  processLevelDistribution: async (userId, level, session) => {
    // 1. Calculate level stats
    const rebirthCount = Math.pow(2, level + 1);
    
    // Check if all rebirths are completed in the ledger
    const completedLedgers = await PoolFundLedger.countDocuments({
      mainUserId: userId,
      level: level,
      type: "REBIRTH_AUTOPOOL_COMPLETED",
    }).session(session);

    if (completedLedgers < rebirthCount) {
      console.log(`[AutoPoolFund] User ${userId} Level ${level} not ready for distribution: ${completedLedgers}/${rebirthCount} rebirths completed.`);
      return;
    }

    // 2. Prevent duplicate level distribution
    const levelLedger = await PoolFundLedger.findOne({
      mainUserId: userId,
      level: level,
      type: "LEVEL_AUTOPOOL_COMPLETED",
    }).session(session);

    if (levelLedger) {
      console.log(`[AutoPoolFund] User ${userId} Level ${level} already distributed, skipping.`);
      return;
    }

    // 3. Formulas (Infinite)
    const grossLevelIncome = rebirthCount * 60;
    const nextLevelRebirthCount = rebirthCount * 2;
    const reinvestAmount = nextLevelRebirthCount * 25;
    const withdrawalAmount = grossLevelIncome - reinvestAmount;
    
    const allocationPerNewRebirth = 25;
    const sponsorDeductionPerRebirth = 2.5;
    const companyDeductionPerRebirth = 2.5;
    const finalPoolValuePerRebirth = 20;

    const user = await User.findById(userId).session(session);
    const sponsorUserId = user?.referredByUserId || null;

    // 4. Create Level Completion Ledger
    const distributionLedger = await PoolFundLedger.create(
      [
        {
          mainUserId: userId,
          sponsorUserId,
          level,
          type: "LEVEL_AUTOPOOL_COMPLETED",
          amount: grossLevelIncome,
          grossLevelIncome,
          withdrawalAmount,
          reinvestAmount,
          allocationPerNewRebirth,
          sponsorDeduction: sponsorDeductionPerRebirth * nextLevelRebirthCount,
          companyDeduction: companyDeductionPerRebirth * nextLevelRebirthCount,
          finalRebirthPoolValue: finalPoolValuePerRebirth * nextLevelRebirthCount,
          status: "COMPLETED",
        },
      ],
      { session }
    );

    // 5. Credit Withdrawal Amount to User Wallet
    if (withdrawalAmount > 0) {
      await PoolFundLedger.create([
        {
          mainUserId: userId,
          level,
          type: "USER_WITHDRAWAL_CREDIT",
          amount: withdrawalAmount,
          status: "COMPLETED",
          meta: { distributionLedgerId: distributionLedger[0]._id }
        }
      ], { session });

      // Update actual wallet and income log
      await Wallet.findOneAndUpdate(
        { userRef: userId },
        { $inc: { withdrawableFund: withdrawalAmount } },
        { session, upsert: true }
      );

      await Income.create([{
        userRef: userId,
        amount: withdrawalAmount,
        incomeType: "autopool",
        entryType: "credit",
        remarks: `AutoPool Level ${level} completion withdrawal credit`,
      }], { session });
    }

    // 6. Handle Reinvestment Allocation Ledgers
    await PoolFundLedger.create([
      {
        mainUserId: userId,
        level,
        type: "REINVEST_TO_POOL_FUND",
        amount: reinvestAmount,
        status: "COMPLETED",
        meta: { distributionLedgerId: distributionLedger[0]._id }
      }
    ], { session });

    // Note: The actual generation of next-level rebirth nodes (e.g. 1.1 to 1.4) 
    // happens in autopool-3x3.service.js. 
    // We will link them to ledgers as they are created or during this loop.
    
    // For every new rebirth to be generated:
    for (let i = 1; i <= nextLevelRebirthCount; i++) {
        // Sponsor Deduction
        if (sponsorUserId) {
            await Wallet.findOneAndUpdate(
                { userRef: sponsorUserId },
                { $inc: { withdrawableFund: sponsorDeductionPerRebirth } },
                { session, upsert: true }
            );
            await Income.create([{
                userRef: sponsorUserId,
                fromUserRef: userId,
                amount: sponsorDeductionPerRebirth,
                incomeType: "sponsor",
                entryType: "credit",
                remarks: `Sponsor income from ${user.memberId} AutoPool Level ${level} completion`,
            }], { session });

            // CREATE LEDGER ENTRY for stats
            await PoolFundLedger.create([{
                mainUserId: userId,
                sponsorUserId,
                level,
                type: "SPONSOR_DEDUCTION",
                amount: sponsorDeductionPerRebirth,
                status: "COMPLETED",
                meta: { distributionLedgerId: distributionLedger[0]._id, rebirthIndex: i }
            }], { session });
        } else {
            // If no sponsor, route to company fund
            await CompanyFund.findOneAndUpdate(
                {},
                { $inc: { totalCompanyFund: sponsorDeductionPerRebirth } },
                { session, upsert: true }
            );

            await PoolFundLedger.create([{
                mainUserId: userId,
                level,
                type: "COMPANY_FUND_DEDUCTION",
                amount: sponsorDeductionPerRebirth,
                status: "COMPLETED",
                meta: { distributionLedgerId: distributionLedger[0]._id, rebirthIndex: i, reason: "NO_SPONSOR" }
            }], { session });
        }

        // Company Deduction
        await CompanyFund.findOneAndUpdate(
            {},
            { $inc: { totalCompanyFund: companyDeductionPerRebirth }, $set: { lastUpdated: new Date() } },
            { session, upsert: true }
        );

        await CompanyFundEntry.create([{
            amount: companyDeductionPerRebirth,
            fromUserId: userId,
            remarks: `AutoPool Level ${level} rebirth deduction`,
        }], { session });

        await PoolFundLedger.create([{
            mainUserId: userId,
            level,
            type: "COMPANY_FUND_DEDUCTION",
            amount: companyDeductionPerRebirth,
            status: "COMPLETED",
            meta: { distributionLedgerId: distributionLedger[0]._id, rebirthIndex: i }
        }], { session });
    }

    console.log(`[AutoPoolFund] Level ${level} distribution completed for user ${user.memberId}. Withdrawal: $${withdrawalAmount}, Reinvest: $${reinvestAmount}`);
  },
};
