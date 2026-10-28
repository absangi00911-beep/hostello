"use client";

import { Search, X } from "lucide-react";
import { useRef, useState, type FormEvent, type MouseEvent } from "react";

export function HostelSearchBar({
  onSearch,
}: {
  onSearch: (destination: string) => void;
}) {
  const [destination, setDestination] = useState("");
  const [moveInDate, setMoveInDate] = useState("");
  const [guestCount, setGuestCount] = useState("1");
  const searchDialogRef = useRef<HTMLDialogElement>(null);

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch(destination.trim());
    if (searchDialogRef.current?.open) {
      searchDialogRef.current.close();
    }
  }

  function renderSearchForm(inDialog: boolean) {
    return (
      <form
        className={`browse-search${inDialog ? " browse-search-dialog-form" : ""}`}
        onSubmit={search}
        role="search"
      >
        <label className="browse-search-field browse-destination-field">
          <span>Where</span>
          <input
            aria-label="Destination"
            autoComplete="off"
            onChange={(event) => setDestination(event.target.value)}
            placeholder="Search destinations"
            type="search"
            value={destination}
          />
        </label>
        <label className="browse-search-field">
          <span>Move-in</span>
          <input
            aria-label="Move-in date"
            onChange={(event) => setMoveInDate(event.target.value)}
            type="date"
            value={moveInDate}
          />
        </label>
        <label className="browse-search-field">
          <span>Guests</span>
          <select
            aria-label="Guests"
            onChange={(event) => setGuestCount(event.target.value)}
            value={guestCount}
          >
            {Array.from({ length: 8 }, (_, index) => index + 1).map((count) => (
              <option key={count} value={String(count)}>
                {count} {count === 1 ? "guest" : "guests"}
              </option>
            ))}
          </select>
        </label>
        <button
          aria-label="Search hostels"
          className="browse-search-submit"
          type="submit"
        >
          <Search aria-hidden="true" size={18} />
        </button>
      </form>
    );
  }

  return (
    <section className="browse-search-section" aria-label="Search stays">
      <button
        aria-label="Start your search"
        className="browse-mobile-search-trigger"
        onClick={() => searchDialogRef.current?.showModal()}
        type="button"
      >
        <Search aria-hidden="true" size={18} />
        <span>Start your search</span>
      </button>
      <dialog
        aria-label="Search stays"
        className="browse-search-dialog"
        onClick={(event: MouseEvent<HTMLDialogElement>) => {
          if (event.target === event.currentTarget) {
            searchDialogRef.current?.close();
          }
        }}
        ref={searchDialogRef}
      >
        <div className="browse-search-dialog-content">
          <div className="browse-search-dialog-header">
            <h2>Search stays</h2>
            <button
              aria-label="Close search"
              className="browse-search-dialog-close"
              onClick={() => searchDialogRef.current?.close()}
              type="button"
            >
              <X aria-hidden="true" size={20} />
            </button>
          </div>
          {renderSearchForm(true)}
          <p className="browse-search-note">
            Move-in date and guests aren&apos;t used to filter availability yet.
          </p>
        </div>
      </dialog>
      {renderSearchForm(false)}
      <p className="browse-search-note">
        Move-in date and guests aren&apos;t used to filter availability yet.
      </p>
    </section>
  );
}
