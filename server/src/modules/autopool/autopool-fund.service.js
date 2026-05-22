import mongoose from "mongoose";
import { PoolFundLedger } from "./pool-fund-ledger.model.js";
import { CompanyFund, CompanyFundEntry } from "./company-fund.model.js";
import { AutoPoolNode } from "./autopool-matrix.model.js";
import { User } from "../user/user.model.js";
import { WalletModel as Wallet } from "../user/wallet.model.js";
import { IncomeLedgerModel as Income } from "../income/income.model.js";
import { generateMemberId } from "../../utils/generateMemberId.js";
import { UserProfile } from "../user/user-profile.model.js";
import { DepositModel } from "../deposit/deposit.model.js";
import { referralService } from "../referral/referral.service.js";
import { distributeDepositIncome } from "../income/incomeDistribution.service.js";

/**
 * AutoPool Level Configuration Rules (Round 0 through Round 9 completion)
 * 
 * Correct Mapping & Payout Rules:
 * - Round 0 Complete: generate Round 1 rebirths (-1.1 to -1.4), NO withdrawal wallet credit.
 * - Round 1 Complete: generate Round 2 rebirths (-2.1 to -2.8), credit $20 to withdrawal wallet.
 * - Round 2 Complete: generate Round 3 rebirths, credit $40 to withdrawal wallet.
 * - Round 3 Complete: generate Round 4 rebirths, credit $80 to withdrawal wallet.
 * - Round 4 Complete: generate Round 5 rebirths, gross $160, deduct $75, 1 alias account, net $85.
 * - Round 5 Complete: generate Round 6 rebirths, gross $320, deduct $75, 1 alias account, net $245.
 * - Round 6 Complete: generate Round 7 rebirths, gross $640, deduct $150, 2 alias accounts, net $490.
 * - Round 7 Complete: generate Round 8 rebirths, gross $1280, deduct $150, 2 alias accounts, net $1130.
 * - Round 8 Complete: generate Round 9 rebirths, gross $2560, deduct $150, 2 alias accounts, net $2410.
 * - Round 9 Complete: stop further rebirth generation, gross $5120, deduct $150, 2 alias accounts, net $4970.
 */
const LEVEL_CONFIGS = {
  0: { withdrawal: 0, reinvest: 100, aliasDeduction: 0, aliases: 0 }, // 0th: NO withdrawal, generate Round 1 rebirths
  1: { withdrawal: 20, reinvest: 200, aliasDeduction: 0, aliases: 0 }, // 1st: credit $20, generate Round 2 rebirths
  2: { withdrawal: 40, reinvest: 400, aliasDeduction: 0, aliases: 0 }, // 2nd: credit $40, generate Round 3 rebirths
  3: { withdrawal: 80, reinvest: 800, aliasDeduction: 0, aliases: 0 }, // 3rd: credit $80, generate Round 4 rebirths
  4: { withdrawal: 85, reinvest: 1600, aliasDeduction: 75, aliases: 1 }, // 4th: gross $160, deduct $75 (1 alias), net $85
  5: { withdrawal: 245, reinvest: 3200, aliasDeduction: 75, aliases: 1 }, // 5th: gross $320, deduct $75 (1 alias), net $245
  6: { withdrawal: 490, reinvest: 6400, aliasDeduction: 150, aliases: 2 }, // 6th: gross $640, deduct $150 (2 aliases), net $490
  7: { withdrawal: 1130, reinvest: 12800, aliasDeduction: 150, aliases: 2 }, // 7th: gross $1280, deduct $150 (2 aliases), net $1130
  8: { withdrawal: 2410, reinvest: 25600, aliasDeduction: 150, aliases: 2 }, // 8th: gross $2560, deduct $150 (2 aliases), net $2410
  9: { withdrawal: 4970, reinvest: 0, aliasDeduction: 150, aliases: 2 } // 9th: gross $5120, deduct $150 (2 aliases), net $4970, stop rebirths
};

/**
 * Create a system-generated Alias Account for a user upon AutoPool Level completion
 */
export async function createAliasAccount(originalUserId, level, aliasIndex, session) {
  // 1. Fetch original owner
  const originalUser = await User.findById(originalUserId).session(session);
  if (!originalUser) throw new Error(`Original user ${originalUserId} not found`);

  const sponsorUser = originalUser.referredByUserId
    ? await User.findById(originalUser.referredByUserId).session(session)
    : originalUser.sponsorUserId
      ? await User.findById(originalUser.sponsorUserId).session(session)
      : originalUser.sponsorId
        ? await User.findOne({ memberId: String(originalUser.sponsorId).trim().toUpperCase() }).session(session)
        : null;
  const sponsorUserId = sponsorUser?._id || null;
  const sponsorMemberId = sponsorUser?.memberId || String(originalUser.sponsorId || "").trim().toUpperCase() || originalUser.memberId;

  // 2. Generate new unique Member ID (e.g. BKS76438)
  const newMemberId = await generateMemberId();

  // 3. Generate unique linked email
  const emailParts = originalUser.email.split("@");
  const localPart = emailParts[0];
  const domainPart = emailParts[1] || "bksalias.local";
  const newEmail = `${localPart}+alias_${newMemberId}@${domainPart}`;

  // 4. Create virtual alias user
  // Sponsor is the original user themselves so they get direct sponsor income!
  const aliasUserDocs = await User.create(
    [
      {
        memberId: newMemberId,
        sponsorId: sponsorMemberId,
        sponsorUserId,
        referredByUserId: sponsorUserId,
        fullName: `${originalUser.fullName} (Alias)`,
        email: newEmail,
        phone: originalUser.phone || "",
        country: originalUser.country || "",
        passwordHash: originalUser.passwordHash,
        plainPassword: originalUser.plainPassword || "VirtualAlias123!",
        referralCode: newMemberId,
        referralLink: `${process.env.BASE_URL || "https://bkswealthclub.local"}/register?ref=${newMemberId}`,
        registrationSource: "admin",
        status: "active",
        activationStatus: "ACTIVE",
        isActivated: true,
        isEmailVerified: true,
        activatedAt: new Date(),
        // Internal alias tracking fields
        isAliasAccount: true,
        isAlias: true,
        aliasOfUserId: originalUser._id,
        aliasOfAccountId: originalUser.memberId,
        originalMainUserId: originalUser._id,
        aliasOwnerUserId: originalUser._id,
        rootOwnerUserId: originalUser.rootOwnerUserId || originalUser._id,
        rootOwnerAccountId: originalUser.rootOwnerAccountId || originalUser.memberId,
        createdFromAutopoolLevel: level,
        aliasSequence: aliasIndex,
        source: "autopool_completion",
        autoCreatedDepositAmount: 75,
        autoDepositAmount: 75,
      },
    ],
    { session }
  );

  const aliasUser = aliasUserDocs[0];

  // 5. Create Wallet for alias
  await Wallet.create(
    [
      {
        userRef: aliasUser._id,
        mainWallet: 0,
        fundWallet: 0,
        holdingWallet: 0,
        lockedAmount: 0,
        withdrawableFund: 0,
      },
    ],
    { session }
  );

  // 6. Create UserProfile for alias
  await UserProfile.create(
    [
      {
        userId: aliasUser._id,
        fatherName: "",
        dob: null,
        gender: "other",
      },
    ],
    { session }
  );

  // 7. Create referral tree node
  await referralService.createReferralTreeNode(
    {
      userId: aliasUser._id,
      sponsorUserId: originalUser._id,
    },
    session
  );

  // 8. Create virtual approved deposit record of $75
  const depositDocs = await DepositModel.create(
    [
      {
        userRef: aliasUser._id,
        amount: 75,
        walletType: "USDT",
        txHash: `ALIAS_AUTO_${newMemberId}_L${level}_I${aliasIndex}`,
        type: "ALIAS_AUTO_DEPOSIT",
        status: "approved",
        paymentStatus: "approved",
        approvalType: "AUTO",
        originalMainUserId: originalUser._id,
        source: "AUTOPOOL_UPGRADE_ALIAS",
        createdFromAutopoolLevel: level,
        processingStatus: "COMPLETED",
        activationProcessed: true,
        rebirthProcessed: true,
        autoPoolProcessed: false,
        incomeDistributed: false,
      },
    ],
    { session }
  );

  const deposit = depositDocs[0];

  // 9. Update the alias user's activatedByDepositId
  aliasUser.activatedByDepositId = deposit._id;
  await aliasUser.save({ session });

  // 10. Run standard deposit income distribution
  await distributeDepositIncome({
    userId: aliasUser._id,
    depositId: deposit._id,
    depositDoc: deposit,
    session,
  });

  // 11. Run autopool success setup for alias
  const { autopool3x3Service } = await import("./autopool-3x3.service.js");
  const autopoolResult = await autopool3x3Service.processDepositSuccessForAutoPool(deposit, session);

  console.log(`[AutoPoolFund] Generated Alias Account ${newMemberId} successfully for ${originalUser.memberId} at Level ${level}`);
  return {
    aliasUser,
    deposit,
    rebirthNodeIds: autopoolResult?.rebirthNodeIds || [],
    sponsorUserId,
    sponsorMemberId,
  };
}

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

    // 3. Load Level completion configs
    const config = LEVEL_CONFIGS[level];
    if (!config) {
      console.warn(`[AutoPoolFund] No level configuration found for level ${level}`);
      return;
    }

    const grossLevelIncome = rebirthCount * 60;
    const reinvestAmount = config.reinvest;
    const withdrawalAmount = config.withdrawal;
    const aliasDeduction = config.aliasDeduction;
    
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
          status: "COMPLETED",
        },
      ],
      { session }
    );

    // 5. User Autopool Credits are now handled by applyAutopoolFundCompletion in AutopoolUserFund.
    // We only save the PoolFundLedger records here for legacy reports/admin views, but do NOT credit Wallet or Income.
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

      // [MODIFIED] Skipped primary Wallet and legacy Income ledger updates
      // Primary wallets are isolated from autopool payouts now.
    }

    // 6. Handle Reinvestment Allocation Ledgers
    if (reinvestAmount > 0) {
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

      // [MODIFIED] Skipped primary fundWallet updates.
    }

    // 7. Handle Alias Accounts generation ledger
    if (aliasDeduction > 0 && config.aliases > 0) {
      await PoolFundLedger.create([
        {
          mainUserId: userId,
          level,
          type: "ALIAS_ACCOUNT_DEDUCTION",
          amount: aliasDeduction,
          status: "COMPLETED",
          meta: { 
            distributionLedgerId: distributionLedger[0]._id,
            aliasCount: config.aliases
          }
        }
      ], { session });

      // [MODIFIED] Skipped legacy virtual alias user creation and standard deposit distribution.
      // Separate UpgradeAliasIds are created by applyAutopoolFundCompletion under the new isolated flow.
    }

    // 8. Generate new Rebirth allocations
    // Each new rebirth generated for the next level requires $25 allocation.
    const nextLevel = level + 1;
    if (nextLevel <= 9) {
      const nextLevelRebirthCount = Math.pow(2, nextLevel + 1);
      const sponsorDeductionPerRebirth = 2.5;
      const companyDeductionPerRebirth = 2.5;
      const finalPoolValuePerRebirth = 20;

      for (let i = 1; i <= nextLevelRebirthCount; i++) {
        // 1. Allocation Entry ($25)
        await PoolFundLedger.create([{
            mainUserId: userId,
            level,
            type: "NEW_REBIRTH_ALLOCATION",
            amount: 25,
            status: "COMPLETED",
            meta: { distributionLedgerId: distributionLedger[0]._id, rebirthIndex: i }
        }], { session });

        // 2. Sponsor Deduction ($2.5) - Keep exactly the same for sponsor income flow!
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

        // 3. Company Deduction ($2.5) - Keep exactly the same!
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

        // 4. Final Rebirth Pool Value ($20)
        await PoolFundLedger.create([{
            mainUserId: userId,
            level,
            type: "FINAL_REBIRTH_POOL_VALUE",
            amount: finalPoolValuePerRebirth,
            status: "COMPLETED",
            meta: { distributionLedgerId: distributionLedger[0]._id, rebirthIndex: i }
        }], { session });
      }
    }

    console.log(`[AutoPoolFund] Level ${level} distribution completed for user ${user.memberId}. Sponsor referral & company payouts processed successfully.`);
  },
};
