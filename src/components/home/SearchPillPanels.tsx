"use client";

import { NEARBY_SEARCH_RADIUS_KM } from "@/lib/nearby-search";
import { SearchDatePicker } from "./SearchDatePicker";
import { SearchLocationPicker } from "./SearchLocationPicker";
import { SearchStudentPicker } from "./SearchStudentPicker";
import type { SearchPillPanel } from "./SearchPillForm";

export type SearchPillLocationStatus = "idle" | "loading" | "ready" | "error";

interface SearchPillPanelsProps {
  activePanel: SearchPillPanel;
  destination: string;
  destinationSuggestions: string[];
  locationError: string | null;
  locationStatus: SearchPillLocationStatus;
  searchError: string | null;
  selectedDate: string;
  studentCount: number;
  onChooseCity: () => void;
  onDoneStudents: () => void;
  onSelectCity: (city: string) => void;
  onSelectDate: (date: string) => void;
  onSelectNearby: () => void;
  onStudentCountChange: (count: number) => void;
}

export function SearchPillPanels({
  activePanel,
  destination,
  destinationSuggestions,
  locationError,
  locationStatus,
  searchError,
  selectedDate,
  studentCount,
  onChooseCity,
  onDoneStudents,
  onSelectCity,
  onSelectDate,
  onSelectNearby,
  onStudentCountChange,
}: SearchPillPanelsProps) {
  const isNearby = destination.toLocaleLowerCase() === "nearby";

  return (
    <>
      {activePanel === "where" && (
        <div
          aria-label="Choose a destination"
          className="absolute top-[calc(100%+8px)] left-0 z-30 max-h-[min(70dvh,520px)] w-[min(340px,calc(100vw-32px))] overflow-y-auto rounded-[20px] border border-line bg-white p-3 shadow-[0_8px_24px_rgb(20_30_24/12%)]"
          role="dialog"
        >
          <SearchLocationPicker
            destinationSuggestions={destinationSuggestions}
            locationError={locationError ?? searchError}
            onSelectCity={onSelectCity}
            onSelectNearby={onSelectNearby}
            query={destination}
          />
        </div>
      )}
      {activePanel === "date" && (
        <div
          aria-label="Choose move-in date"
          className="absolute top-[calc(100%+12px)] left-1/2 z-30 max-h-[min(70dvh,640px)] w-[min(700px,calc(100vw-32px))] -translate-x-1/2 overflow-y-auto rounded-2xl border border-line bg-white p-5 shadow-[0_10px_34px_rgb(20_30_24/16%)] [@media(max-width:720px)]:left-0 [@media(max-width:720px)]:w-full [@media(max-width:720px)]:translate-x-0"
          role="dialog"
        >
          {isNearby && locationStatus === "loading" && (
            <p className="mb-4 text-sm text-muted" role="status">
              Getting your location for a {NEARBY_SEARCH_RADIUS_KM} km search...
            </p>
          )}
          {isNearby && locationStatus === "ready" && (
            <p className="mb-4 text-sm text-muted" role="status">
              Using your location within {NEARBY_SEARCH_RADIUS_KM} km.
            </p>
          )}
          {isNearby && locationStatus === "error" && (
            <div className="mb-4">
              <p className="m-0 text-sm text-[#9b2c18]" role="alert">
                {locationError}
              </p>
              <button
                className="mt-2 min-h-9 rounded-full border border-line px-3 text-sm font-medium text-ink focus-visible:outline-2! focus-visible:outline-brand! btn-secondary"
                onClick={onChooseCity}
                type="button"
              >
                Choose a city
              </button>
            </div>
          )}
          <SearchDatePicker
            onSelect={onSelectDate}
            selectedDate={selectedDate}
          />
        </div>
      )}
      {activePanel === "students" && (
        <div
          aria-label="Choose students"
          className="absolute top-[calc(100%+12px)] right-0 z-30 w-[min(360px,calc(100vw-32px))] rounded-2xl border border-line bg-white p-5 shadow-[0_10px_34px_rgb(20_30_24/16%)] [@media(max-width:720px)]:left-0"
          role="dialog"
        >
          <SearchStudentPicker
            count={studentCount}
            onChange={onStudentCountChange}
            onDone={onDoneStudents}
          />
        </div>
      )}
    </>
  );
}
