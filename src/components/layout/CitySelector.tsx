// Path: src/components/layout/CitySelector.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MapPin, ChevronDown } from "lucide-react";
import { CITIES } from "@hostello/shared";

const STORAGE_KEY = "hostello-city";

export function CitySelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [city, setCity] = useState<string>("All cities");

  // On mount, restore from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && CITIES.includes(stored as (typeof CITIES)[number])) {
      setCity(stored);
    }
  }, []);

  // Sync from URL param when on search page
  useEffect(() => {
    const urlCity = searchParams.get("city");
    if (urlCity && CITIES.includes(urlCity as (typeof CITIES)[number])) {
      setCity(urlCity);
    }
  }, [searchParams]);

  function handleSelect(selected: string) {
    setCity(selected);
    localStorage.setItem(STORAGE_KEY, selected);

    // If already on the search page, update the city filter in-place
    if (window.location.pathname === "/hostels") {
      const params = new URLSearchParams(window.location.search);
      params.set("city", selected);
      router.push(`/hostels?${params.toString()}`);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 rounded-[var(--radius-md)] px-3 py-2 text-[var(--text-body-sm)] font-[500] text-[var(--color-text-body)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] transition-all duration-[var(--transition-fast)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-bg-overlay)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] focus-visible:outline-offset-2">
          <MapPin
            size={14}
            strokeWidth={1.5}
            className="text-[var(--color-primary)] shrink-0"
            aria-hidden="true"
          />
          <span className="max-w-[100px] truncate hidden sm:block">{city}</span>
          <ChevronDown
            size={12}
            strokeWidth={1.5}
            className="text-[var(--color-text-muted)] shrink-0"
            aria-hidden="true"
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        sideOffset={8}
        className="w-44 rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] p-1 shadow-[var(--shadow-lg)] max-h-80 overflow-y-auto"
      >
        <DropdownMenuItem
          onSelect={() => handleSelect("All cities")}
          className="rounded-[var(--radius-sm)] px-3 py-2 text-[var(--text-body-sm)] text-[var(--color-text-muted)] cursor-pointer hover:bg-[var(--color-bg-overlay)]"
        >
          All cities
        </DropdownMenuItem>

        {CITIES.map((c) => (
          <DropdownMenuItem
            key={c}
            onSelect={() => handleSelect(c)}
            className={`rounded-[var(--radius-sm)] px-3 py-2 text-[var(--text-body-sm)] cursor-pointer transition-colors ${
              city === c
                ? "bg-[var(--color-primary-faint)] text-[var(--color-primary-deep)] font-[500]"
                : "text-[var(--color-text-body)] hover:bg-[var(--color-bg-overlay)]"
            }`}
          >
            {c}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
