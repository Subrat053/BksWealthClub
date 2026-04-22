export function getPagination(query = {}) {
  const page = Math.max(1, Number(query.page || 1));
  const limit = Math.max(1, Math.min(100, Number(query.limit || 20)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
