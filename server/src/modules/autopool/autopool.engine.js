/**
 * autopool.engine.js
 *
 * Pure business-logic helpers for the 3-system MLM flow.
 * No DB calls, no side effects.
 */

export const ACTIVATION_AMOUNT_USD = 75;
export const MAX_AUTOPOOL_CHILDREN = 3;
export const MAX_REBIRTH_CHILDREN = 2;

export function buildInitialRebirthIds(memberId) {
  return [`${memberId}-R1`, `${memberId}-R2`];
}

export function buildChildRebirthId(parentRebirthCode, index, parentGeneration) {
  if (parentGeneration === 0) {
    return `${parentRebirthCode}-R${index}`;
  }
  return `${parentRebirthCode}-A${index}`;
}

export function ensureChildCapacity(currentCount, maxCount) {
  if (currentCount >= maxCount) {
    throw new Error("Node already has maximum children.");
  }
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
