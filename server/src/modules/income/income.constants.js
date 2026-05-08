/**
 * income.constants.js
 *
 * All monetary constants for the $75 deposit income distribution.
 * These are the ONLY source of truth for distribution amounts.
 * The frontend must NEVER supply amounts — they come from here.
 *
 * Distribution breakdown:
 *   RB1 wallet:       $20
 *   RB2 wallet:       $20
 *   Sponsor income:   $5
 *   Company fund:     $5
 *   Achiever fund:    $4
 *   Admin fund:       $5
 *   9-Level income:   $16
 *   ─────────────────────
 *   Total:            $75
 */

// ─── Deposit & Rebirth ────────────────────────────────────────────────────────

export const DEPOSIT_AMOUNT = 75;
export const RB1_AMOUNT = 20;
export const RB2_AMOUNT = 20;

// ─── Sponsor ──────────────────────────────────────────────────────────────────

export const SPONSOR_PER_RB = 2.5;
export const SPONSOR_TOTAL = 5;

// ─── SuperAdmin Funds ─────────────────────────────────────────────────────────

export const COMPANY_FUND_PER_RB = 2.5;
export const COMPANY_FUND_TOTAL = 5;

export const ACHIEVER_FUND_PER_RB = 2;
export const ACHIEVER_FUND_TOTAL = 4;

export const ADMIN_FUND_PER_RB = 2.5;
export const ADMIN_FUND_TOTAL = 5;

// ─── 9-Level Income ──────────────────────────────────────────────────────────

export const LEVEL_INCOME_RULES = [
  { level: 1, perRebirth: 2.5, total: 5 },
  { level: 2, perRebirth: 1, total: 2 },
  { level: 3, perRebirth: 1, total: 2 },
  { level: 4, perRebirth: 1, total: 2 },
  { level: 5, perRebirth: 0.5, total: 1 },
  { level: 6, perRebirth: 0.5, total: 1 },
  { level: 7, perRebirth: 0.5, total: 1 },
  { level: 8, perRebirth: 0.5, total: 1 },
  { level: 9, perRebirth: 0.5, total: 1 },
];

export const LEVEL_TOTAL = 16;

// ─── Income Types ─────────────────────────────────────────────────────────────

export const INCOME_TYPES = {
  RB_INCOME: "RB_INCOME",
  SPONSOR_INCOME: "SPONSOR_INCOME",
  COMPANY_FUND: "COMPANY_FUND",
  ACHIEVER_FUND: "ACHIEVER_FUND",
  ADMIN_FUND: "ADMIN_FUND",
  LEVEL_INCOME: "LEVEL_INCOME",
  LEFTOVER_TO_COMPANY: "LEFTOVER_TO_COMPANY",
};

// ─── Sanity Check ─────────────────────────────────────────────────────────────
// This runs at import time — if the constants are ever changed inconsistently,
// the server will refuse to start.

const EXPECTED_TOTAL =
  RB1_AMOUNT +
  RB2_AMOUNT +
  SPONSOR_TOTAL +
  COMPANY_FUND_TOTAL +
  ACHIEVER_FUND_TOTAL +
  ADMIN_FUND_TOTAL +
  LEVEL_TOTAL;

if (EXPECTED_TOTAL !== DEPOSIT_AMOUNT) {
  throw new Error(
    `[income.constants] Distribution constants don't add up! ` +
      `Expected ${DEPOSIT_AMOUNT}, got ${EXPECTED_TOTAL}`,
  );
}
