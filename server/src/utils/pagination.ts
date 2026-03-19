type PaginationParseOptions = {
  defaultPage?: number;
  defaultLimit?: number;
  maxLimit?: number;
};

const toPositiveInt = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const integer = Math.floor(parsed);
  return integer > 0 ? integer : fallback;
};

export const parsePagination = (
  query: Record<string, unknown>,
  {
    defaultPage = 1,
    defaultLimit = 10,
    maxLimit = 100,
  }: PaginationParseOptions = {},
) => {
  const page = toPositiveInt(query.page, defaultPage);
  const rawLimit = toPositiveInt(query.limit, defaultLimit);
  const limit = Math.min(rawLimit, maxLimit);

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    take: limit,
  };
};

export const buildPaginationMeta = ({
  page,
  limit,
  total,
}: {
  page: number;
  limit: number;
  total: number;
}) => {
  const safeTotal = Math.max(0, total);
  const totalPages = Math.ceil(safeTotal / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    page,
    current: page,
    limit,
    total: safeTotal,
    totalItems: safeTotal,
    totalPages,
    pages: totalPages,
    hasNext,
    hasPrev,
    nextPage: hasNext ? page + 1 : null,
    prevPage: hasPrev ? page - 1 : null,
  };
};
