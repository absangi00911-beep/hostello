"use client";

import { Search } from "lucide-react";
import { useState, type FormEvent } from "react";

export function HostelSearchBar({
  onSearch,
}: {
  onSearch: (destination: string) => void;
}) {
  const [destination, setDestination] = useState("");
  const [moveInDate, setMoveInDate] = useState("");
  const [guestCount, setGuestCount] = useState("1");

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch(destination.trim());
  }

  return (
    <section className="browse-search-section" aria-label="Search stays">
      <form className="browse-search" onSubmit={search} role="search">
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
      <p className="browse-search-note">
        Move-in date and guests aren&apos;t used to filter availability yet.
      </p>
    </section>
  );
}
