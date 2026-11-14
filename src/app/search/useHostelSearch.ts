// Path: src/app/search/useHostelSearch.ts
import { useEffect, useRef, useState } from "react";
import {
  hostelSearchRequestKey,
  loadHostelSearch,
  shouldSkipHostelSearchLoad,
  type HostelSearchInitialResults,
  type HostelSearchRequest,
  type HostelSearchResult,
} from "./load-hostel-search";

/**
 * Loads results whenever the applied search changes, cancelling the request that is
 * still in flight. Returns the component state; `retry` repeats the current search.
 *
 * `initialResults` are the server-rendered answer to the first search: they are shown
 * immediately and the first load is skipped. Any later change of search fetches again.
 */
export function useHostelSearch(
  request: HostelSearchRequest,
  initialResults: HostelSearchInitialResults | null = null,
) {
  const [hostels, setHostels] = useState<HostelSearchResult[]>(initialResults?.hostels ?? []);
  const [totalHostels, setTotalHostels] = useState(initialResults?.total ?? 0);
  const [isLoading, setIsLoading] = useState(initialResults === null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  // The search the results on screen answer. It is a ref, not state, and the skip below
  // changes nothing, so React's development double-run of effects behaves like production.
  const loadedRef = useRef<{ key: string; reload: number } | null>(
    initialResults ? { key: hostelSearchRequestKey(request), reload: 0 } : null,
  );

  const {
    query,
    city,
    moveInDate,
    checkOutDate,
    guests,
    nearby,
    filters,
    page,
    initialNearbyCoordinates,
  } = request;

  useEffect(() => {
    const key = hostelSearchRequestKey({
      query, city, moveInDate, checkOutDate, guests, nearby, filters, page, initialNearbyCoordinates,
    });
    if (shouldSkipHostelSearchLoad(loadedRef.current, key, reload)) return;

    const controller = new AbortController();

    async function load() {
      setIsLoading(true);
      setSearchError(null);
      const outcome = await loadHostelSearch(
        { query, city, moveInDate, checkOutDate, guests, nearby, filters, page, initialNearbyCoordinates },
        controller.signal,
      );

      if (outcome.status === "ok") {
        loadedRef.current = { key, reload };
        setHostels(outcome.hostels);
        setTotalHostels(outcome.total);
      } else if (outcome.status === "error") {
        loadedRef.current = null;
        setHostels([]);
        setTotalHostels(0);
        setSearchError(outcome.message);
      }
      // An aborted request leaves the results alone. The spinner is cleared unless this
      // effect itself was cancelled, in which case the next run owns it.
      if (!controller.signal.aborted) setIsLoading(false);
    }

    void load();
    return () => controller.abort();
  }, [city, guests, moveInDate, checkOutDate, nearby, filters, query, page, reload, initialNearbyCoordinates]);

  return {
    hostels,
    totalHostels,
    isLoading,
    searchError,
    retry: () => setReload((current) => current + 1),
  };
}
