/**
 * autopool.engine.js
 *
 * Pure business-logic layer — no DB calls, no side effects.
 * All functions take plain objects and return plain objects.
 *
 * Matrix: 1×3 (one parent, max 3 children per node)
 * Ordering: BFS — oldest unfilled node first (millisecond joinedAt)
 *
 * BKS Wealth Club Income Rules (per PDF):
 * ─────────────────────────────────────────
 * Entry: $75 → creates 2 node IDs (.1 active, .2 on-hold)
 *
 * When a node completes (3 children filled):
 *   cycleNumber 1  → total pool income = $120  → withdrawable $20  → reinvest/rebirth: 2 new IDs
 *   cycleNumber 2  → total pool income = $240  → withdrawable $40  → reinvest/rebirth: 4 new IDs
 *   cycleNumber 3  → total pool income = $480  → withdrawable $80  → reinvest/rebirth: 8 new IDs
 *   ... doubles each cycle up to cycle 10
 *
 * Sponsor (direct referral) income: $5 per activation
 *   ($2.5 from slot .1 + $2.5 from slot .2)
 *
 * Level income (paid when someone in your downline activates):
 *   Level 1: $5, Level 2-3: $2, Level 4-5-6-7-8-9: $1
 */

// ─── Constants ────────────────────────────────────────────────────────────────

export const ACTIVATION_AMOUNT_USD = 75;
export const MAX_CHILDREN_PER_NODE = 3;
export const SPONSOR_INCOME_PER_SLOT = 2.5; // × 2 slots = $5 total

/**
 * Income schedule per cycle (1-indexed).
 * Returns { totalIncome, withdrawable, rebirthIdCount }
 */
export const CYCLE_INCOME_SCHEDULE = {
  1: { totalIncome: 120, withdrawable: 20, rebirthIdCount: 2 },
  2: { totalIncome: 240, withdrawable: 40, rebirthIdCount: 4 },
  3: { totalIncome: 480, withdrawable: 80, rebirthIdCount: 8 },
  4: { totalIncome: 960, withdrawable: 160, rebirthIdCount: 16 },
  5: { totalIncome: 1920, withdrawable: 320, rebirthIdCount: 32 },
  6: { totalIncome: 3840, withdrawable: 640, rebirthIdCount: 64 },
  7: { totalIncome: 7680, withdrawable: 1280, rebirthIdCount: 128 },
  8: { totalIncome: 15360, withdrawable: 2560, rebirthIdCount: 256 },
  9: { totalIncome: 30720, withdrawable: 5120, rebirthIdCount: 512 },
  10: { totalIncome: 61440, withdrawable: 10240, rebirthIdCount: 1024 },
};

export const LEVEL_INCOME_MAP = {
  1: 5,
  2: 2,
  3: 2,
  4: 2,
  5: 1,
  6: 1,
  7: 1,
  8: 1,
  9: 1,
};

// ─── Dual-ID Generation ───────────────────────────────────────────────────────

/**
 * Build the two node IDs for a newly activating member.
 * e.g. memberId "BWC001234" → ["BWC001234.1", "BWC001234.2"]
 */
export function buildDualNodeIds(memberId) {
  return [`${memberId}.1`, `${memberId}.2`];
}

/**
 * Build the payload objects for the two nodes to be inserted into DB.
 * Parent assignment happens separately after BFS lookup.
 */
export function buildDualNodePayloads({
  userRef,
  memberId,
  rebirthFromNodeRef = null,
  cycleNumber = 1,
}) {
  const now = new Date();
  const [id1, id2] = buildDualNodeIds(memberId);

  return [
    {
      userRef,
      nodeId: id1,
      slotIndex: 1,
      status: "active", // immediately enters the pool queue
      cycleNumber,
      rebirthFromNodeRef,
      joinedAt: now,
      childrenCount: 0,
    },
    {
      userRef,
      nodeId: id2,
      slotIndex: 2,
      status: "on_hold", // waits until needed for rebirth fill
      cycleNumber,
      rebirthFromNodeRef,
      joinedAt: new Date(now.getTime() + 1), // 1ms later to preserve order
      childrenCount: 0,
    },
  ];
}

// ─── Placement Logic ──────────────────────────────────────────────────────────

/**
 * Given a parent node, determine the next positionUnderParent (1, 2, or 3).
 * childrenCount on the parent is the count BEFORE this placement.
 */
export function resolveChildPosition(parentChildrenCount) {
  if (parentChildrenCount >= MAX_CHILDREN_PER_NODE) {
    throw new Error("Parent node is already full (3/3 children).");
  }
  return parentChildrenCount + 1;
}

/**
 * Compute the level of a new child node.
 */
export function resolveChildLevel(parentLevel) {
  return parentLevel + 1;
}

// ─── Completion / Rebirth Logic ───────────────────────────────────────────────

/**
 * When a node reaches 3 children, calculate what happens next.
 *
 * @param {object} completedNode - the node that just completed
 * @returns {{ cycleIncome, withdrawable, reinvestAmount, rebirthIdCount }}
 */
export function calculateCompletionRewards(completedNode) {
  const cycleNumber = completedNode.cycleNumber || 1;
  const schedule =
    CYCLE_INCOME_SCHEDULE[cycleNumber] || CYCLE_INCOME_SCHEDULE[1];

  return {
    cycleNumber,
    totalIncome: schedule.totalIncome,
    withdrawable: schedule.withdrawable,
    reinvestAmount: schedule.totalIncome - schedule.withdrawable,
    rebirthIdCount: schedule.rebirthIdCount,
  };
}

/**
 * Build rebirth node payloads for a completed node.
 * These are NEW slots for the SAME user, re-entering the pool.
 *
 * For rebirth, we generate sequential nodeIds using a timestamp suffix
 * so they don't collide with the original .1 / .2 IDs.
 *
 * e.g. "BWC001234.R1-1", "BWC001234.R1-2" for cycle 1 rebirth
 */
export function buildRebirthNodePayloads({
  userRef,
  memberId,
  completedNodeRef,
  cycleNumber,
  rebirthIdCount,
}) {
  const nextCycle = cycleNumber + 1;
  const now = new Date();
  const nodes = [];

  for (let i = 1; i <= rebirthIdCount; i++) {
    nodes.push({
      userRef,
      nodeId: `${memberId}.R${cycleNumber}-${i}`,
      slotIndex: 1,
      status: "active",
      cycleNumber: nextCycle,
      rebirthFromNodeRef: completedNodeRef,
      joinedAt: new Date(now.getTime() + i), // preserve microsecond ordering
      childrenCount: 0,
    });
  }

  return nodes;
}

// ─── Income Ledger Entries ────────────────────────────────────────────────────

/**
 * Build the income ledger entry for sponsor (direct referral) income.
 * Sponsor earns $2.5 per slot = $5 total for one activation.
 */
export function buildSponsorIncomeEntry({
  sponsorUserRef,
  fromUserRef,
  slotNodeId,
  amount = SPONSOR_INCOME_PER_SLOT,
}) {
  return {
    userRef: sponsorUserRef,
    incomeType: "sponsor",
    amount,
    entryType: "credit",
    remarks: `Direct referral income from node ${slotNodeId}`,
    referenceId: slotNodeId,
    occurredAt: new Date(),
    fromUserRef,
  };
}

/**
 * Build level income entries for upline ancestors.
 * ancestors = [{ userRef, level }] sorted level 1 → 9
 */
export function buildLevelIncomeEntries({ ancestors, fromMemberId, nodeId }) {
  return ancestors
    .filter(({ level }) => LEVEL_INCOME_MAP[level] !== undefined)
    .map(({ userRef, level }) => ({
      userRef,
      incomeType: "representative",
      amount: LEVEL_INCOME_MAP[level],
      entryType: "credit",
      remarks: `Level ${level} income from member ${fromMemberId} node ${nodeId}`,
      referenceId: nodeId,
      occurredAt: new Date(),
    }));
}

/**
 * Build autopool completion income entry for the node owner.
 */
export function buildAutopoolIncomeEntry({
  userRef,
  nodeId,
  withdrawable,
  cycleNumber,
}) {
  return {
    userRef,
    incomeType: "autopool",
    amount: withdrawable,
    entryType: "credit",
    remarks: `Autopool cycle ${cycleNumber} completion income from node ${nodeId}`,
    referenceId: nodeId,
    occurredAt: new Date(),
  };
}
