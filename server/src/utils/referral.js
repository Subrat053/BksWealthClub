export function buildReferralLink(baseUrl, referralCode) {
  return `${baseUrl}/register?ref=${encodeURIComponent(referralCode)}`;
}

export function normalizeSponsorInput(input = "") {
  return String(input).trim().toUpperCase();
}
