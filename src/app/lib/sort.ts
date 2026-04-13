export type IdLike = string | number | null | undefined;

function normalizeIdToString(id: IdLike): string {
  if (id === null || id === undefined) return '';
  return String(id).trim();
}

/**
 * Extracts the last digit-run in an id string (e.g., "REQ001" -> 1, "ALERT-12A" -> 12).
 * Returns null when no digits exist.
 */
function extractTrailingNumber(id: string): number | null {
  const m = id.match(/(\d+)(?!.*\d)/);
  if (!m) return null;
  const n = Number.parseInt(m[1], 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * Compare two ids in descending order.
 * - If both contain numbers, sort by number desc, then by string desc.
 * - Otherwise sort by string desc (case-insensitive).
 */
export function compareIdDesc(a: IdLike, b: IdLike): number {
  const as = normalizeIdToString(a);
  const bs = normalizeIdToString(b);

  const an = extractTrailingNumber(as);
  const bn = extractTrailingNumber(bs);

  if (an !== null && bn !== null && an !== bn) return bn - an;

  // Tie-breaker / fallback: lexicographic desc (case-insensitive), then original.
  const ac = as.toLowerCase();
  const bc = bs.toLowerCase();
  if (ac < bc) return 1;
  if (ac > bc) return -1;
  if (as < bs) return 1;
  if (as > bs) return -1;
  return 0;
}

export function sortByIdDesc<T>(items: T[], getId: (item: T) => IdLike): T[] {
  return [...items].sort((x, y) => compareIdDesc(getId(x), getId(y)));
}

