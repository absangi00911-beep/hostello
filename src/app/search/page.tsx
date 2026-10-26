"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Star } from "lucide-react";
import { useEffect, useState } from "react";

const popularCities = [
  "Lahore",
  "Karachi",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
];

interface HostelSearchResult {
  id: string;
  name: string;
  city: string;
  area: string | null;
  pricePerMonth: number;
  coverImage: string | null;
  images: string[];
  rating: number;
  reviewCount: number;
}

interface HostelSearchResponse {
  data: HostelSearchResult[];
  total: number;
  error?: string;
}

export default function SearchPage() {
  const [cityQuery, setCityQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [hostels, setHostels] = useState<HostelSearchResult[]>([]);
  const [totalHostels, setTotalHostels] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const filteredCities = popularCities.filter((city) =>
    city.toLowerCase().includes(cityQuery.trim().toLowerCase()),
  );

  useEffect(() => {
    const city = new URLSearchParams(window.location.search)
      .get("city")
      ?.trim();

    if (!city) return;

    setCityQuery(city);
    setSelectedCity(city);
  }, []);

  useEffect(() => {
    if (!selectedCity) return;

    const city = selectedCity;
    const controller = new AbortController();

    async function loadHostels() {
      setIsLoading(true);
      setSearchError(null);

      try {
        const query = new URLSearchParams({
          city,
          sort: "rating",
          page: "1",
          limit: "50",
        });
        const response = await fetch(`/api/hostels?${query}`, {
          signal: controller.signal,
        });
        const result = (await response.json()) as HostelSearchResponse;

        if (!response.ok) {
          setHostels([]);
          setTotalHostels(0);
          setSearchError(
            result.error ?? "Unable to load hostels. Please try again.",
          );
          return;
        }
        if (
          !Array.isArray(result.data) ||
          !Number.isSafeInteger(result.total) ||
          result.total < result.data.length
        ) {
          setHostels([]);
          setTotalHostels(0);
          setSearchError("Unable to load hostels. Please try again.");
          return;
        }

        setHostels(result.data);
        setTotalHostels(result.total);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        setHostels([]);
        setTotalHostels(0);
        setSearchError("Unable to load hostels. Please try again.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadHostels();
    return () => controller.abort();
  }, [selectedCity]);

  return (
    <main className="search-page">
      <div className="search-shell">
        <section className="city-picker" aria-labelledby="city-picker-title">
          <p className="eyebrow">Find your next stay</p>
          <h1 id="city-picker-title">Where do you want to stay?</h1>
          <p className="city-picker-description">
            Choose a city to explore student-friendly hostels.
          </p>

          <label className="city-search-label" htmlFor="city-search">
            Search for a city
          </label>
          <input
            autoComplete="off"
            className="city-search-input"
            id="city-search"
            onChange={(event) => setCityQuery(event.target.value)}
            placeholder="Type a city name"
            type="search"
            value={cityQuery}
          />

          <div
            className="city-choice-list"
            role="group"
            aria-label="Popular cities"
          >
            {filteredCities.map((city) => (
              <button
                aria-pressed={selectedCity === city}
                className="city-choice"
                key={city}
                onClick={() => setSelectedCity(city)}
                type="button"
              >
                {city}
              </button>
            ))}
            {filteredCities.length === 0 && (
              <p className="city-empty-state" role="status">
                No matching city found.
              </p>
            )}
          </div>
          {selectedCity && (
            <p className="selected-city" aria-live="polite">
              Selected city: <strong>{selectedCity}</strong>
            </p>
          )}
        </section>

        {selectedCity && (
          <section className="hostel-row" aria-labelledby="best-hostels-title">
            <div className="hostel-row-heading">
              <div>
                <p className="eyebrow">Explore the city</p>
                <h2 id="best-hostels-title">Best hostel in {selectedCity}</h2>
              </div>
              {!isLoading && !searchError && totalHostels > 0 && (
                <p className="hostel-row-count">
                  {totalHostels} {totalHostels === 1 ? "stay" : "stays"}
                </p>
              )}
            </div>

            {isLoading && (
              <p className="hostel-row-message" role="status">
                Finding hostels in {selectedCity}…
              </p>
            )}
            {searchError && (
              <p className="hostel-row-message" role="alert">
                {searchError}
              </p>
            )}
            {!isLoading && !searchError && hostels.length === 0 && (
              <p className="hostel-row-message" role="status">
                No hostels found in {selectedCity} yet.
              </p>
            )}
            {!isLoading && !searchError && hostels.length > 0 && (
              <div
                className="hostel-carousel"
                role="region"
                aria-label={`Best hostels in ${selectedCity}`}
                tabIndex={0}
              >
                {hostels.map((hostel) => {
                  const image = hostel.coverImage || hostel.images[0];

                  return (
                    <Link
                      aria-label={`View details for ${hostel.name}`}
                      className="hostel-card-link"
                      href={`/hostels/${hostel.id}`}
                      key={hostel.id}
                    >
                      <article className="hostel-card">
                        <div className="hostel-card-image">
                          {image ? (
                            <Image
                              alt={hostel.name}
                              className="hostel-card-photo"
                              fill
                              sizes="(max-width: 720px) 40vw, (max-width: 1100px) 23vw, 12vw"
                              src={image}
                            />
                          ) : (
                            <div
                              className="hostel-image-fallback"
                              role="img"
                              aria-label={`No photo available for ${hostel.name}`}
                            />
                          )}
                        </div>
                        <div className="hostel-card-details">
                          <h3 title={hostel.name}>{hostel.name}</h3>
                          <p className="hostel-card-price">
                            PKR {hostel.pricePerMonth.toLocaleString("en-PK")}
                            <span> / month</span>
                          </p>
                          <div className="hostel-card-meta">
                            <span
                              aria-label={
                                hostel.reviewCount > 0
                                  ? `Rated ${hostel.rating.toFixed(1)} out of 5`
                                  : "No ratings yet"
                              }
                              className="hostel-card-rating"
                              role="img"
                            >
                              {hostel.reviewCount > 0 ? (
                                <>
                                  <Star
                                    aria-hidden="true"
                                    size={14}
                                    fill="currentColor"
                                  />
                                  {hostel.rating.toFixed(1)}
                                </>
                              ) : (
                                "New"
                              )}
                            </span>
                            <span className="hostel-card-area">
                              <MapPin aria-hidden="true" size={13} />
                              {hostel.area || hostel.city}
                            </span>
                          </div>
                        </div>
                      </article>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
