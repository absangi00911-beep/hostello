"use client";

import { MapPin } from "lucide-react";

interface SearchLocationPickerProps {
  query: string;
  destinationSuggestions: string[];
  locationError: string | null;
  onSelectCity: (city: string) => void;
  onSelectNearby: () => void;
}

export function SearchLocationPicker({
  query,
  destinationSuggestions,
  locationError,
  onSelectCity,
  onSelectNearby,
}: SearchLocationPickerProps) {
  const matchingCities = destinationSuggestions.filter((city) =>
    city.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );

  return (
    <div className="space-y-3">
      {locationError && (
        <p className="m-0 rounded-lg bg-[#fff4f1] px-3 py-2 text-sm text-[#9b2c18]" role="alert">
          {locationError}
        </p>
      )}
      <p className="m-0 px-1 text-[0.68rem] font-semibold text-muted">
        Suggested destinations
      </p>
      <div>
        <button
          aria-label="Nearby"
          className="flex min-h-[58px] w-full items-center gap-3 rounded-xl border-0 bg-transparent px-2.5 text-left text-ink transition-colors hover:bg-[#f5f5f4] focus-visible:outline-2! focus-visible:outline-brand!"
          onClick={onSelectNearby}
          type="button"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#eef3ff] text-brand">
            <MapPin aria-hidden="true" size={18} />
          </span>
          <span>
            <span className="block text-sm font-semibold text-ink">Nearby</span>
            <span className="mt-0.5 block text-xs text-muted">
              Search within 25 km of your location
            </span>
          </span>
        </button>
        {matchingCities.length > 0 ? (
          <ul className="m-0 grid max-h-[min(50dvh,360px)] list-none gap-0.5 overflow-y-auto p-0">
            {matchingCities.map((city) => (
              <li key={city}>
                <button
                  className="flex min-h-[58px] w-full items-center gap-3 rounded-xl border-0 bg-transparent px-2.5 text-left text-ink transition-colors hover:bg-[#f5f5f4] focus-visible:outline-2! focus-visible:outline-brand!"
                  onClick={() => onSelectCity(city)}
                  type="button"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#eef3ff] text-brand">
                    <MapPin aria-hidden="true" size={18} />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-ink">
                      {city}, Pakistan
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      Explore student stays
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="m-0 px-3 py-2 text-sm text-muted">
            No suggested city matches. You can still search for "{query}".
          </p>
        )}
      </div>
    </div>
  );
}
