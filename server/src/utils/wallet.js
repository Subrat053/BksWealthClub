export function calculateWithdrawal({ amount, chargePercent }) {
  const numericAmount = Number(amount || 0);
  const numericChargePercent = Number(chargePercent || 0);
  const charge = Number(((numericAmount * numericChargePercent) / 100).toFixed(2));
  const payable = Number((numericAmount - charge).toFixed(2));
  return { charge, payable };
}
