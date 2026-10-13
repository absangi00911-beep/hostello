"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    router.push(`/hostels?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex min-h-[60px] w-full items-center gap-2 rounded-[22px] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-2 pl-4 shadow-[var(--shadow-sm)] transition-[box-shadow] duration-[var(--transition-medium)] focus-within:shadow-[var(--shadow-md)]"
      role="search"
      aria-label="Find a hostel"
    >
      <Search
        size={18}
        strokeWidth={1.5}
        className="shrink-0 text-[color:var(--color-text-muted)]"
        aria-hidden="true"
      />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by hostel, area, or university"
        aria-label="Search hostels"
        className="h-10 min-w-0 flex-1 bg-transparent px-2 text-[length:var(--text-body-sm)] text-[color:var(--color-text-body)] placeholder:text-[color:var(--color-text-placeholder)] focus:outline-none"
      />
      <button
        type="submit"
        aria-label="Search"
        className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-action)] text-[color:var(--color-text-inverse)] transition-[background-color,transform] duration-[var(--transition-base)] hover:bg-[var(--color-action-dark)] active:scale-[0.96]"
      >
        <Search
          size={17}
          strokeWidth={2}
          className="transition-transform duration-[var(--transition-fast)] group-hover:scale-110"
          aria-hidden="true"
        />
      </button>
    </form>
  );
}
