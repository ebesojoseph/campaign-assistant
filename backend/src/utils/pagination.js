export function parsePagination({ page = 1, limit = 20 } = {}, maxLimit = 100) {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.min(maxLimit, Math.max(1, Number(limit) || 20));
  return { page: p, limit: l, offset: (p - 1) * l };
}

export const paginated = (rows, total, { page, limit }) => ({
  data: rows,
  meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
});

export const paginationSchema = {
  page: { type: 'number', integer: true, min: 1, default: 1 },
  limit: { type: 'number', integer: true, min: 1, max: 100, default: 20 },
};
