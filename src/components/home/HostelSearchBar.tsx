"use client";

import { Search, X } from "lucide-react";
import {
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import type { NearbyCoordinates } from "@/lib/nearby-search";
import { SearchPillForm, type SearchPillPanel } from "./SearchPillForm";
import { SearchPillPanels } from "./SearchPillPanels";
import { useNearbyLocation } from "./useNearbyLocation";

export interface HostelSearchFilters {
  destination: string;
  moveInDate: string;
  guests: number;
  nearby?: NearbyCoordinates;
}

export function HostelSearchBar({
  destinationSuggestions = [],
  onSearch,
}: {
  destinationSuggestions?: string[];
  onSearch: (filters: HostelSearchFilters) => boolean | void;
}) {
  const [destination, setDestination] = useState("");
  const [moveInDate, setMoveInDate] = useState("");
  const [studentCount, setStudentCount] = useState(1);
  const [activePanel, setActivePanel] = useState<SearchPillPanel>(null);
  const {
    coordinates: nearbyCoordinates,
    error: locationError,
    requestLocation,
    reset: clearNearbySelection,
    status: locationStatus,
  } = useNearbyLocation();
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchDialogRef = useRef<HTMLDialogElement>(null);

  function selectCity(city: string) {
    clearNearbySelection();
    setDestination(city);
    setSearchError(null);
    setActivePanel("date");
  }

  function selectNearby() {
    setDestination("Nearby");
    setSearchError(null);
    setActivePanel("date");
    requestLocation();
  }

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearchError(null);

    const isNearby = destination.trim().toLocaleLowerCase() === "nearby";
    if (isNearby && !nearbyCoordinates) {
      setSearchError(
        locationError ??
          (locationStatus === "loading"
            ? "Please wait while we determine your location."
            : "Select Nearby from the suggestions to allow a nearby search."),
      );
      setActivePanel(locationStatus === "error" ? "where" : "date");
      return;
    }

    const started = onSearch({
      destination: isNearby ? "" : destination.trim(),
      moveInDate,
      guests: studentCount,
      ...(isNearby && nearbyCoordinates
        ? { nearby: nearbyCoordinates }
        : {}),
    });
    if (started === false) {
      setSearchError(
        "Nearby search could not be started. Please try again or choose a city.",
      );
      setActivePanel("where");
      return;
    }
    if (searchDialogRef.current?.open) {
      searchDialogRef.current.close();
    }
  }

  function handlePanelKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key === "Escape") setActivePanel(null);
  }

  function renderSearchForm(inDialog: boolean) {
    return (
      <SearchPillForm
        activePanel={activePanel}
        destination={destination}
        inDialog={inDialog}
        moveInDate={moveInDate}
        onClearDestination={() => {
          setDestination("");
          clearNearbySelection();
          setSearchError(null);
          setActivePanel("where");
        }}
        onDestinationChange={(value) => {
          setDestination(value);
          clearNearbySelection();
          setSearchError(null);
          setActivePanel("where");
        }}
        onDestinationFocus={() => setActivePanel("where")}
        onKeyDown={handlePanelKeyDown}
        onSubmit={search}
        onToggleDate={() =>
          setActivePanel(activePanel === "date" ? null : "date")
        }
        onToggleStudents={() =>
          setActivePanel(activePanel === "students" ? null : "students")
        }
        studentCount={studentCount}
      >
        <SearchPillPanels
          activePanel={activePanel}
          destination={destination}
          destinationSuggestions={destinationSuggestions}
          locationError={locationError}
          locationStatus={locationStatus}
          onChooseCity={() => {
            setDestination("");
            setActivePanel("where");
          }}
          onDoneStudents={() => setActivePanel(null)}
          onSelectCity={selectCity}
          onSelectDate={(date) => {
            setMoveInDate(date);
            setSearchError(null);
            setActivePanel(null);
          }}
          onSelectNearby={selectNearby}
          onStudentCountChange={setStudentCount}
          searchError={searchError}
          selectedDate={moveInDate}
          studentCount={studentCount}
        />
      </SearchPillForm>
    );
  }

  return (
    <section
      className="w-full border-b border-line bg-[#fcfcfb] py-[14px] [@media(max-width:720px)]:py-3 [@media(max-width:720px)]:pb-[10px]"
      aria-label="Search stays"
    >
      <div className="mx-auto w-[min(1920px,calc(100%-var(--page-gutter-total)))] [@media(max-width:960px)]:w-[min(calc(100%-var(--page-gutter-tablet)),1344px)] [@media(max-width:720px)]:w-[min(calc(100%-var(--page-gutter-mobile)),600px)]! [@media(max-width:420px)]:w-[calc(100%-var(--page-gutter-mobile))]">
        <button
          aria-label="Start your search"
          className="hidden min-h-14 w-full cursor-pointer items-center justify-center gap-[11px] rounded-full border border-line bg-white px-[18px] py-3 text-[0.94rem] font-semibold text-ink shadow-[0_4px_14px_rgb(29_42_34/8%)] transition-[box-shadow,transform] duration-[180ms] active:scale-[0.99] focus-visible:outline-2! focus-visible:outline-brand! focus-visible:outline-offset-[3px]! [@media(max-width:720px)]:flex motion-reduce:active:transform-none!"
          onClick={() => searchDialogRef.current?.showModal()}
          type="button"
        >
          <Search aria-hidden="true" size={18} />
          <span>Start your search</span>
        </button>
        <dialog
          aria-label="Search stays"
          className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-y-auto border-0 bg-white px-4 pt-5 pb-[calc(24px+env(safe-area-inset-bottom))] text-ink [@media(min-width:721px)]:h-auto [&::backdrop]:bg-[rgb(20_30_24/42%)]"
          onClick={(event: MouseEvent<HTMLDialogElement>) => {
            if (event.target === event.currentTarget) {
              searchDialogRef.current?.close();
            }
          }}
          onClose={() => setActivePanel(null)}
          ref={searchDialogRef}
        >
          <div className="mx-auto w-[min(100%,560px)]">
            <div className="mb-5 flex min-h-11 items-center justify-between">
              <h2 className="m-0 text-[1.15rem] font-bold">Search stays</h2>
              <button
                aria-label="Close search"
                className="grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-line bg-white text-ink btn-secondary"
                onClick={() => searchDialogRef.current?.close()}
                type="button"
              >
                <X aria-hidden="true" size={20} />
              </button>
            </div>
            {renderSearchForm(true)}
            <p className="mt-2 text-center text-[0.7rem] text-muted">
              Availability is checked only on the selected move-in date.
            </p>
          </div>
        </dialog>
        {renderSearchForm(false)}
        <p className="mt-2 text-center text-[0.7rem] text-muted [@media(max-width:720px)]:hidden">
          Availability is checked only on the selected move-in date.
        </p>
      </div>
    </section>
  );
}
