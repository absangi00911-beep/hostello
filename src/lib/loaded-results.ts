// Path: src/lib/loaded-results.ts

/**
 * What the results on screen answer: the search (or tab) they belong to and the retry
 * count they were fetched at. Null when nothing on screen can be trusted.
 */
export type LoadedResults = { key: string; reload: number } | null;

/**
 * True when the results already on screen answer exactly this request, so fetching again
 * would only repeat the work. A retry always fetches, because its count differs.
 */
export function isLoadedResultsCurrent(loaded: LoadedResults, key: string, reload: number): boolean {
  return loaded !== null && loaded.key === key && loaded.reload === reload;
}
