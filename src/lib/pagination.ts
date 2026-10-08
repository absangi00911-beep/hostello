const MAX_PAGE = 10_000;

interface PaginationOptions {
  defaultLimit: number;
  maxLimit: number;
}

/** Parse bounded offset pagination for API collection routes. */
export function parsePagination(
  params: URLSearchParams,
  { defaultLimit, maxLimit }: PaginationOptions,
) {
  const parsedPage = Number.parseInt(params.get("page") ?? "1", 10);
  const parsedLimit = Number.parseInt(params.get("limit") ?? String(defaultLimit), 10);

  const page = Number.isFinite(parsedPage)
    ? Math.min(MAX_PAGE, Math.max(1, parsedPage))
    : 1;
  const limit = Number.isFinite(parsedLimit)
    ? Math.min(maxLimit, Math.max(1, parsedLimit))
    : defaultLimit;

  return { page, limit, skip: (page - 1) * limit };
}
