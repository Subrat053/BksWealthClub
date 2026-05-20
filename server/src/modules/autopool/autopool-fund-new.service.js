import mongoose from "mongoose";
import { AutopoolUserFund } from "./autopool-user-fund.model.js";
import { AutopoolFundTransaction } from "./autopool-fund-transaction.model.js";
import { UpgradeAliasId } from "./upgrade-alias-id.model.js";
import { User } from "../user/user.model.js";

// Centralized Constant Maps
export const POOL_FUND_MAP = {
  0: 0,
  1: 120,
  2: 240,
  3: 480,
  4: 960,
  5: 1920,
  6: 3840,
  7: 7680,
  8: 15360,
  9: 30720,
};

export const REINVESTMENT_FUND_MAP = {
  0: 0,
  1: 100,
  2: 200,
  3: 400,
  4: 800,
  5: 1600,
  6: 3200,
  7: 6400,
  8: 12800,
  9: 26400,
};

export const WITHDRAWABLE_FUND_MAP = {
  0: 0,
  1: 20,
  2: 40,
  3: 80,
  4: 160,
  5: 320,
  6: 640,
  7: 1280,
  8: 2560,
  9: 5120,
};

export const UPGRADE_ID_COUNT_MAP = {
  4: 1,
  5: 1,
  6: 2,
  7: 2,
  8: 2,
  9: 2,
};

export const UPGRADE_ID_COST = 75;

const normalizeAutopoolLevel = (completedLevel) => {
  const level = Number.isFinite(Number(completedLevel))
    ? Math.floor(Number(completedLevel))
    : 0;
  return Math.max(0, Math.min(9, level));
};

export function calculateAutopoolFundSummary(completedLevel) {
  const resolvedLevel = normalizeAutopoolLevel(completedLevel);

  let poolFundTotal = 0;
  let reinvestmentFundTotal = 0;
  let withdrawableAutopoolFund = 0;
  let upgradeIdCount = 0;
  let upgradeDeductionTotal = 0;

  for (let level = 1; level <= resolvedLevel; level++) {
    poolFundTotal += getPoolFundByLevel(level);
    reinvestmentFundTotal += getReinvestmentFundByLevel(level);
    withdrawableAutopoolFund += getWithdrawableFundByLevel(level);

    const levelUpgradeCount = getUpgradeIdCountByLevel(level);
    if (levelUpgradeCount > 0) {
      const levelDeduction = levelUpgradeCount * UPGRADE_ID_COST;
      upgradeIdCount += levelUpgradeCount;
      upgradeDeductionTotal += levelDeduction;
      withdrawableAutopoolFund -= levelDeduction;
    }
  }

  return {
    completedAutopoolLevel: resolvedLevel,
    poolFundTotal,
    reinvestmentFundTotal,
    withdrawableAutopoolFund,
    upgradeIdCount,
    upgradeDeductionTotal,
  };
}

// Helper getters
export function getPoolFundByLevel(level) {
  return POOL_FUND_MAP[level] || 0;
}

export function getReinvestmentFundByLevel(level) {
  return REINVESTMENT_FUND_MAP[level] || 0;
}

export function getWithdrawableFundByLevel(level) {
  return WITHDRAWABLE_FUND_MAP[level] || 0;
}

export function getUpgradeIdCountByLevel(level) {
  return UPGRADE_ID_COUNT_MAP[level] || 0;
}

/**
 * Create Upgrade/Alias IDs for completed level
 */
export async function createUpgradeIdsForLevel(userId, level, session = null) {
  const user = await User.findById(userId).session(session);
  if (!user) throw new Error(`User ${userId} not found`);

  const count = getUpgradeIdCountByLevel(level);
  if (count <= 0) return [];

  const createdIds = [];
  for (let i = 1; i <= count; i++) {
    const aliasId = `${user.memberId}-U${level}.${i}`;
    
    // Upsert to ensure idempotency
    const existing = await UpgradeAliasId.findOne({ aliasId }).session(session);
    if (!existing) {
      const aliasDoc = await UpgradeAliasId.create(
        [
          {
            userId,
            aliasId,
            sourceAutopoolLevel: level,
            deductionAmount: UPGRADE_ID_COST,
            status: "ACTIVE",
          },
        ],
        { session }
      );
      createdIds.push(aliasDoc[0]);
    } else {
      createdIds.push(existing);
    }
  }

  return createdIds;
}

/**
 * Main application entry to credit autopool funds & deduct upgrades
 */
export async function applyAutopoolFundCompletion(
  userId,
  level,
  sourceRebirthIds,
  session = null
) {
  // 1. Idempotency Check:
  //    - For non-zero payout levels: check if POOL_FUND_CREDIT transaction already exists.
  //    - For zero-payout levels (level 0): check lastCompletedRound in AutopoolUserFund.
  const poolAmount = getPoolFundByLevel(level);
  if (poolAmount > 0) {
    // Non-zero payout: guard via transaction record
    const existingTx = await AutopoolFundTransaction.findOne({
      userId,
      completedLevel: level,
      type: "POOL_FUND_CREDIT",
    }).session(session);

    if (existingTx) {
      console.log(
        `[AutopoolFundNew] Level ${level} already credited for user ${userId}, skipping duplicates.`
      );
      const currentFund = await AutopoolUserFund.findOne({ userId }).session(session);
      return currentFund;
    }
  } else {
    // Zero-payout level: guard via lastCompletedRound in fund record
    const existingFund = await AutopoolUserFund.findOne({ userId }).session(session);
    if (existingFund && existingFund.lastCompletedRound >= level) {
      console.log(
        `[AutopoolFundNew] Level ${level} (zero-payout) already tracked for user ${userId}, skipping.`
      );
      return existingFund;
    }
  }

  // Get user details
  const user = await User.findById(userId).session(session);
  if (!user) throw new Error(`User ${userId} not found`);

  // Calculate funds for this level
  const poolCredit = getPoolFundByLevel(level);
  const reinvestCredit = getReinvestmentFundByLevel(level);
  const withdrawableCredit = getWithdrawableFundByLevel(level);
  const upgradeCount = getUpgradeIdCountByLevel(level);
  const totalUpgradeDeduction = upgradeCount * UPGRADE_ID_COST;

  // ─── Level 0 Guard ────────────────────────────────────────────────────────
  // When completedRebirthRound is 0, all payout amounts are 0.
  // Do NOT create any fund transactions; simply update the tracking fields.
  if (poolCredit === 0 && reinvestCredit === 0 && withdrawableCredit === 0 && upgradeCount === 0) {
    // Still fetch/create the fund record so completedAutopoolLevel is tracked
    let userFund = await AutopoolUserFund.findOne({ userId }).session(session);
    if (!userFund) {
      userFund = new AutopoolUserFund({ userId });
    }
    // Update level tracking only (no monetary change)
    if (userFund.completedAutopoolLevel < level) {
      userFund.completedAutopoolLevel = level;
    }
    if (userFund.lastCompletedRound < level) {
      userFund.lastCompletedRound = level;
    }
    await userFund.save({ session });
    console.log(
      `[AutopoolFundNew] Level ${level} completed for ${user.memberId} — zero-payout round, no transactions created.`
    );
    return userFund;
  }
  // ─────────────────────────────────────────────────────────────────────────

  // 2. Fetch or create AutopoolUserFund record
  let userFund = await AutopoolUserFund.findOne({ userId }).session(session);
  if (!userFund) {
    userFund = new AutopoolUserFund({ userId });
  }

  const sourceRebirthStr = Array.isArray(sourceRebirthIds)
    ? sourceRebirthIds.join(", ")
    : String(sourceRebirthIds);

  // Apply Pool Fund Credit
  userFund.poolFundTotal += poolCredit;
  await AutopoolFundTransaction.create(
    [
      {
        userId,
        sourceRebirthId: sourceRebirthStr,
        completedLevel: level,
        type: "POOL_FUND_CREDIT",
        amount: poolCredit,
        balanceAfter: userFund.poolFundTotal,
        description: `Pool Fund Credit for completing Autopool Level ${level}`,
      },
    ],
    { session }
  );

  // Apply Reinvestment Fund Credit
  userFund.reinvestmentFundTotal += reinvestCredit;
  await AutopoolFundTransaction.create(
    [
      {
        userId,
        sourceRebirthId: sourceRebirthStr,
        completedLevel: level,
        type: "REINVESTMENT_FUND_CREDIT",
        amount: reinvestCredit,
        balanceAfter: userFund.reinvestmentFundTotal,
        description: `Reinvestment Fund Credit for completing Autopool Level ${level}`,
      },
    ],
    { session }
  );

  // Apply Withdrawable Autopool Credit
  userFund.withdrawableAutopoolFund += withdrawableCredit;
  await AutopoolFundTransaction.create(
    [
      {
        userId,
        sourceRebirthId: sourceRebirthStr,
        completedLevel: level,
        type: "WITHDRAWABLE_AUTOPOOL_CREDIT",
        amount: withdrawableCredit,
        balanceAfter: userFund.withdrawableAutopoolFund,
        description: `Withdrawable Autopool Fund Credit for completing Autopool Level ${level}`,
      },
    ],
    { session }
  );

  // Apply Upgrade ID Deductions if level >= 4
  if (upgradeCount > 0) {
    // Generate upgrade IDs
    await createUpgradeIdsForLevel(userId, level, session);

    userFund.upgradeIdCount += upgradeCount;
    userFund.upgradeDeductionTotal += totalUpgradeDeduction;
    userFund.withdrawableAutopoolFund -= totalUpgradeDeduction;

    await AutopoolFundTransaction.create(
      [
        {
          userId,
          sourceRebirthId: sourceRebirthStr,
          completedLevel: level,
          type: "UPGRADE_ID_DEDUCTION",
          amount: totalUpgradeDeduction,
          balanceAfter: userFund.withdrawableAutopoolFund,
          description: `Deduction of $${totalUpgradeDeduction} for creating ${upgradeCount} Upgrade ID(s) upon completing Autopool Level ${level}`,
        },
      ],
      { session }
    );
  }

  // Update completed level metrics
  userFund.completedAutopoolLevel = Math.max(userFund.completedAutopoolLevel, level);
  userFund.lastCompletedRound = Math.max(userFund.lastCompletedRound, level);

  await userFund.save({ session });

  console.log(
    `[AutopoolFundNew] Applied fund completion for Level ${level} to user ${user.memberId}. Net withdrawable: $${userFund.withdrawableAutopoolFund}`
  );

  return userFund;
}
