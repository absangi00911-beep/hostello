// Path: src/app/search/useHostelSearch.ts
import { useEffect, useState } from "react";
import {
  loadHostelSearch,
  type HostelSearchRequest,
  type HostelSearchResult,
} from "./load-hostel-search";

/**
 * Loads results whenever the applied search changes, cancelling the request that is
 * still in flight. Returns the component state; `retry` repeats the current search.
 */
export function useHostelSearch(request: HostelSearchRequest) {
  const [hostels, setHostels] = useState<HostelSearchResult[]>([]);
  const [totalHostels, setTotalHostels] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

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
    const controller = new AbortController();

    async function load() {
      setIsLoading(true);
      setSearchError(null);
      const outcome = await loadHostelSearch(
        { query, city, moveInDate, checkOutDate, guests, nearby, filters, page, initialNearbyCoordinates },
        controller.signal,
      );

      if (outcome.status === "ok") {
        setHostels(outcome.hostels);
        setTotalHostels(outcome.total);
      } else if (outcome.status === "error") {
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
