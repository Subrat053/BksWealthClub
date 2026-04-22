export function generateUsername(prefix = "BKS") {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}${random}`;
}
