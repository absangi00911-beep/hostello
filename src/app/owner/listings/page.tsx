// Path: src/app/owner/listings/page.tsx
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { Plus, Building2, Pencil, ExternalLink } from "lucide-react";
import { useState } from "react";
import {
  EmptyState,
  PageSpinner,
  InlineError,
  StatusBadge,
  formatPKR,
} from "@/components/ui/shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface OwnerHostel {
  id: string;
  name: string;
  slug: string;
  city: string;
  area?: string | null;
  status: "DRAFT" | "PENDING_REVIEW" | "ACTIVE" | "SUSPENDED";
  pricePerMonth: number;
  rooms: number;
  capacity: number;
  cancellationPolicy: "FLEXIBLE" | "STANDARD" | "STRICT" | null;
  coverImage?: string | null;
  verified: boolean;
  reviewCount: number;
  rating: number;
}

/* -- Status action button ---------------------------------- */
function StatusAction({
  hostel,
  onAction,
  loading,
}: {
  hostel: OwnerHostel;
  onAction: (id: string, status: string) => void;
  loading: boolean;
}) {
  if (hostel.status === "ACTIVE") {
    return (
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onAction(hostel.id, "DRAFT")}
        disabled={loading}
        loading={loading}
        className="h-7 px-2.5"
      >
        Take offline
      </Button>
    );
  }
  if (hostel.status === "DRAFT") {
    return (
      <Button
        size="sm"
        onClick={() => onAction(hostel.id, "PENDING_REVIEW")}
        disabled={loading}
        loading={loading}
        className="h-7 px-2.5"
      >
        Submit for review
      </Button>
    );
  }
  if (hostel.status === "PENDING_REVIEW") {
    return (
      <span className="text-[length:var(--text-caption)] text-[color:var(--color-text-muted)] italic">
        Under review
      </span>
    );
  }
  if (hostel.status === "SUSPENDED") {
    return (
      <span className="text-[length:var(--text-caption)] text-[color:var(--color-error)]">
        Suspended by admin
      </span>
    );
  }
  return null;
}

/* -- Listing row card -------------------------------------- */
function ListingCard({
  hostel,
  onStatusAction,
  actionLoading,
}: {
  hostel: OwnerHostel;
  onStatusAction: (id: string, status: string) => void;
  actionLoading: boolean;
}) {
  return (
    <Card className="flex flex-col gap-4 p-4 sm:flex-row">
      {/* Thumbnail */}
      <div className="relative h-24 w-full sm:h-20 sm:w-32 shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-bg-overlay)]">
        {hostel.coverImage ? (
          <Image
            src={hostel.coverImage}
            alt={hostel.name}
            fill
            className="object-cover"
            sizes="128px"
            unoptimized={hostel.coverImage.includes(".r2.dev/")}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Building2 size={20} strokeWidth={1.5} className="text-[color:var(--color-text-muted)]" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <h3
              className="truncate text-[length:var(--text-body-sm)] font-[600] text-[color:var(--color-text-heading)]"

            >
              {hostel.name}
            </h3>
            <p className="text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">
              {hostel.city}{hostel.area ? `, ${hostel.area}` : ""}
            </p>
          </div>
          <StatusBadge variant={hostel.status.toLowerCase() as any} />
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">
          <span className="font-[600] text-[color:var(--color-primary-deep)]">{formatPKR(hostel.pricePerMonth)}/mo</span>
          <span>{hostel.rooms} rooms · {hostel.capacity} capacity</span>
          {hostel.reviewCount > 0 && <span>★ {hostel.rating.toFixed(1)} ({hostel.reviewCount})</span>}
        </div>

        {hostel.status === "ACTIVE" && !hostel.cancellationPolicy && (
          <div className="rounded-[var(--radius-md)] border border-[var(--color-warning)]/25 bg-[var(--color-warning-bg)] px-3 py-2 text-[length:var(--text-caption)] text-[color:var(--color-warning-text)]">
            Booking is unavailable until you choose cancellation terms. Editing the listing sends it for review again.
            <Link
              href={`/owner/listings/${hostel.id}/edit`}
              className="ml-1 font-[600] underline underline-offset-2"
            >
              Choose terms
            </Link>
          </div>
        )}

        {/* Actions row */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button asChild variant="secondary" size="sm" className="h-7 px-2.5">
            <Link href={`/owner/listings/${hostel.id}/edit`}>
              <Pencil size={11} strokeWidth={1.5} aria-hidden="true" />
              Edit
            </Link>
          </Button>

          {hostel.status === "ACTIVE" && (
            <Button asChild variant="secondary" size="sm" className="h-7 px-2.5">
              <Link href={`/hostels/${hostel.slug}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={11} strokeWidth={1.5} aria-hidden="true" />
                View live
              </Link>
            </Button>
          )}

          <StatusAction
            hostel={hostel}
            onAction={onStatusAction}
            loading={actionLoading}
          />
        </div>
      </div>
    </Card>
  );
}

/* -- Page --------------------------------------------------- */
export default function OwnerListingsPage() {
  const queryClient = useQueryClient();
  const [actingId, setActingId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery<{ data: OwnerHostel[] }>({
    queryKey: ["owner-listings"],
    queryFn: async () => {
      const res = await fetch("/api/hostels/mine");
      if (!res.ok) throw new Error("Failed to load listings");
      return res.json();
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      setActingId(id);
      const res = await fetch(`/api/hostels/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Update failed");
      return json;
    },
    onSuccess: (_, { status }) => {
      toast.success(
        status === "PENDING_REVIEW"
          ? "Listing submitted for review."
          : "Listing taken offline."
      );
      queryClient.invalidateQueries({ queryKey: ["owner-listings"] });
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => setActingId(null),
  });

  if (isLoading) return <PageSpinner label="Loading listings…" />;
  if (isError)   return <InlineError message="Couldn't load your listings. Please refresh." />;

  const listings = data?.data ?? [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)]">
          {listings.length} listing{listings.length !== 1 ? "s" : ""}
        </p>
        {/* Primary CTA — accent color, consistent with all CTAs in the app */}
        <Button asChild size="default" className="gap-2">
          <Link href="/owner/listings/new">
            <Plus size={15} strokeWidth={1.5} aria-hidden="true" />
            Add new listing
          </Link>
        </Button>
      </div>

      {/* List */}
      {listings.length === 0 ? (
        <EmptyState
          icon={Building2}
          heading="No listings yet"
          description="Add your first hostel to start receiving bookings."
          action={
            <Button asChild size="default" className="gap-2">
              <Link href="/owner/listings/new">
                <Plus size={15} strokeWidth={1.5} aria-hidden="true" />
                Add your first listing
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-3" role="list" aria-label="Your listings">
          {listings.map((hostel) => (
            <div key={hostel.id} role="listitem">
              <ListingCard
                hostel={hostel}
                onStatusAction={(id, status) => statusMutation.mutate({ id, status })}
                actionLoading={actingId === hostel.id}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
