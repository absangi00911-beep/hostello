// Path: src/app/owner/listings/page.tsx
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { Plus, Building2, Pencil, ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";
import {
  EmptyState,
  PageSpinner,
  InlineError,
  StatusBadge,
  formatPKR,
} from "@/components/ui/shared";

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
      <button
        onClick={() => onAction(hostel.id, "DRAFT")}
        disabled={loading}
        className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[var(--radius-sm)] border border-[var(--color-border-default)] text-[var(--text-caption)] font-[500] text-[var(--color-text-muted)] hover:border-[var(--color-warning)] hover:text-[var(--color-warning)] transition-colors duration-[var(--transition-fast)] disabled:opacity-50"
      >
        {loading && <Loader2 size={11} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />}
        Take offline
      </button>
    );
  }
  if (hostel.status === "DRAFT") {
    return (
      <button
        onClick={() => onAction(hostel.id, "PENDING_REVIEW")}
        disabled={loading}
        className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[var(--radius-sm)] bg-[var(--color-action)] text-[var(--text-caption)] font-[500] text-white hover:bg-[var(--color-action-dark)] transition-colors duration-[var(--transition-base)] disabled:opacity-50"
      >
        {loading && <Loader2 size={11} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />}
        Submit for review
      </button>
    );
  }
  if (hostel.status === "PENDING_REVIEW") {
    return (
      <span className="text-[var(--text-caption)] text-[var(--color-text-muted)] italic">
        Under review
      </span>
    );
  }
  if (hostel.status === "SUSPENDED") {
    return (
      <span className="text-[var(--text-caption)] text-[var(--color-error)]">
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
    <div className="flex flex-col sm:flex-row gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-4">
      {/* Thumbnail */}
      <div className="relative h-24 w-full sm:h-20 sm:w-32 shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-bg-overlay)]">
        {hostel.coverImage ? (
          <Image src={hostel.coverImage} alt={hostel.name} fill className="object-cover" sizes="128px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Building2 size={20} strokeWidth={1.5} className="text-[var(--color-text-muted)]" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <h3
              className="truncate text-[var(--text-body-sm)] font-[600] text-[var(--color-text-heading)]"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {hostel.name}
            </h3>
            <p className="text-[var(--text-caption)] text-[var(--color-text-muted)]">
              {hostel.city}{hostel.area ? `, ${hostel.area}` : ""}
            </p>
          </div>
          <StatusBadge variant={hostel.status.toLowerCase() as any} />
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[var(--text-caption)] text-[var(--color-text-muted)]">
          <span className="font-[600] text-[var(--color-primary-deep)]">{formatPKR(hostel.pricePerMonth)}/mo</span>
          <span>{hostel.rooms} rooms · {hostel.capacity} capacity</span>
          {hostel.reviewCount > 0 && <span>★ {hostel.rating.toFixed(1)} ({hostel.reviewCount})</span>}
        </div>

        {/* Actions row */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <Link
            href={`/owner/listings/${hostel.id}/edit`}
            className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[var(--radius-sm)] border border-[var(--color-border-default)] text-[var(--text-caption)] font-[500] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-overlay)] transition-colors duration-[var(--transition-fast)]"
          >
            <Pencil size={11} strokeWidth={1.5} aria-hidden="true" />
            Edit
          </Link>

          {hostel.status === "ACTIVE" && (
            <Link
              href={`/hostels/${hostel.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[var(--radius-sm)] border border-[var(--color-border-default)] text-[var(--text-caption)] font-[500] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-overlay)] transition-colors duration-[var(--transition-fast)]"
            >
              <ExternalLink size={11} strokeWidth={1.5} aria-hidden="true" />
              View live
            </Link>
          )}

          <StatusAction
            hostel={hostel}
            onAction={onStatusAction}
            loading={actionLoading}
          />
        </div>
      </div>
    </div>
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
        <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
          {listings.length} listing{listings.length !== 1 ? "s" : ""}
        </p>
        {/* Amber brand button — per DESIGN.md, used only for owner CTAs */}
        <Link
          href="/owner/listings/new"
          className="inline-flex items-center gap-2 h-9 px-4 rounded-[var(--radius-md)] text-[var(--text-body-sm)] font-[500] transition-all duration-[var(--transition-base)] hover:-translate-y-px hover:shadow-[var(--shadow-sm)] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-[var(--color-primary-deep)] focus-visible:outline-offset-2"
          style={{ backgroundColor: "var(--color-primary)", color: "var(--color-text-heading)" }}
        >
          <Plus size={15} strokeWidth={1.5} aria-hidden="true" />
          Add new listing
        </Link>
      </div>

      {/* List */}
      {listings.length === 0 ? (
        <EmptyState
          icon={Building2}
          heading="No listings yet"
          description="Add your first hostel to start receiving bookings."
          action={
            <Link
              href="/owner/listings/new"
              className="inline-flex items-center gap-2 h-9 px-4 rounded-[var(--radius-md)] text-[var(--text-body-sm)] font-[500]"
              style={{ backgroundColor: "var(--color-primary)", color: "var(--color-text-heading)" }}
            >
              <Plus size={15} strokeWidth={1.5} aria-hidden="true" />
              Add your first listing
            </Link>
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
