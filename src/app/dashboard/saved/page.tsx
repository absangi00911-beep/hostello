// Path: src/app/dashboard/saved/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { Heart, Building2, Star, X } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, PageSpinner, InlineError, formatPKR } from "@/components/ui/shared";
import { Button } from "@/components/ui/button";

interface SavedHostel {
  id: string;
  name: string;
  slug: string;
  city: string;
  area?: string | null;
  pricePerMonth: number;
  gender: string;
  coverImage?: string | null;
  verified: boolean;
  rating: number;
  reviewCount: number;
}

function SavedHostelCard({
  hostel,
  onRemove,
  removing,
}: {
  hostel: SavedHostel;
  onRemove: (slug: string) => void;
  removing: boolean;
}) {
  return (
    <div className="group relative rounded-[var(--radius-lg)] overflow-hidden transition-shadow duration-[var(--transition-base)] hover:shadow-[var(--shadow-md)]">
      {/* Remove button — top-right */}
      <button
        onClick={() => onRemove(hostel.slug)}
        disabled={removing}
        aria-label={`Remove ${hostel.name} from saved`}
        className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] text-[color:var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-all duration-[var(--transition-fast)] hover:text-[color:var(--color-error)] hover:border-[var(--color-error)] focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]"
      >
        <X size={13} strokeWidth={1.5} aria-hidden="true" />
      </button>

      <Link
        href={`/hostels/${hostel.slug}`}
        className="block focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] focus-visible:outline-offset-[-2px]"
      >
        {/* Image */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--color-bg-overlay)]">
          {hostel.coverImage ? (
            <Image
              src={hostel.coverImage}
              alt={hostel.name}
              fill
              className="object-cover transition-transform duration-[var(--transition-slow)] group-hover:scale-[1.02]"
              sizes="(max-width: 640px) 100vw, 50vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Building2 size={28} strokeWidth={1.5} className="text-[color:var(--color-text-muted)]" aria-hidden="true" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-1.5">
          <h3
            className="truncate text-[length:var(--text-body-sm)] font-[600] text-[color:var(--color-text-heading)]"

          >
            {hostel.name}
          </h3>
          <p className="text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">
            {hostel.city}{hostel.area ? `, ${hostel.area}` : ""}
          </p>
          <div className="flex items-center justify-between">
            <p className="text-[length:var(--text-body-sm)] font-[700] text-[color:var(--color-primary-deep)]">
              {formatPKR(hostel.pricePerMonth)}
              <span className="text-[length:var(--text-caption)] font-[400] text-[color:var(--color-text-muted)]">/mo</span>
            </p>
            {hostel.reviewCount > 0 && (
              <div className="flex items-center gap-1">
                <Star size={12} strokeWidth={1.5} className="text-[color:var(--color-primary)] fill-[var(--color-primary)]" aria-hidden="true" />
                <span className="text-[length:var(--text-caption)] font-[500] text-[color:var(--color-text-body)]">
                  {hostel.rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}

export default function SavedPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [removingSlug, setRemovingSlug] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery<{
    data: SavedHostel[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }>({
    queryKey: ["favorites", page],
    queryFn: async () => {
      const res = await fetch(`/api/favorites?page=${page}&limit=20`);
      if (!res.ok) throw new Error("Failed to load saved hostels");
      return res.json();
    },
  });
  const hostels = data?.data ?? [];

  const removeMutation = useMutation({
    mutationFn: async (slug: string) => {
      setRemovingSlug(slug);
      const res = await fetch(`/api/hostels/${slug}/favorite`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove");
    },
    onSuccess: () => {
      toast.success("Removed from saved.");
      if (hostels.length === 1 && page > 1) setPage((current) => Math.max(1, current - 1));
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
    onError: () => toast.error("Couldn't remove. Try again."),
    onSettled: () => setRemovingSlug(null),
  });

  if (isLoading) return <PageSpinner label="Loading saved hostels…" />;
  if (isError)   return <InlineError message="Couldn't load your saved hostels. Please refresh." />;

  if (data?.total === 0) {
    return (
      <EmptyState
        icon={Heart}
        heading="Nothing saved"
        description="Tap the bookmark on any hostel to save it for later."
        action={
          <Button asChild>
            <Link href="/hostels">Browse hostels</Link>
          </Button>
        }
      />
    );
  }

  if (hostels.length === 0) {
    return <InlineError message="No saved hostels on this page. Return to the previous page to continue." />;
  }

  return (
    <div className="space-y-5">
      <p className="text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)]">
        {data?.total ?? 0} saved hostel{data?.total === 1 ? "" : "s"}
      </p>
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        role="list"
        aria-label="Saved hostels"
      >
        {hostels.map((hostel) => (
          <div key={hostel.id} role="listitem">
            <SavedHostelCard
              hostel={hostel}
              onRemove={(slug) => removeMutation.mutate(slug)}
              removing={removingSlug === hostel.slug}
            />
          </div>
        ))}
      </div>
      {(page > 1 || data?.hasMore) && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page === 1}
            className="rounded-md border border-[var(--color-border-default)] px-3 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">
            Page {page} of {Math.max(1, Math.ceil((data?.total ?? 0) / (data?.limit ?? 20)))}
          </span>
          <button
            type="button"
            onClick={() => setPage((current) => current + 1)}
            disabled={!data?.hasMore}
            className="rounded-md border border-[var(--color-border-default)] px-3 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
