"use client";
// Path: src/components/admin/HostelReviewDrawer.tsx

import { useEffect } from "react";
import Image from "next/image";
import { X, MapPin, Users, BedDouble, Star, ShieldCheck, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PageSpinner, InlineError } from "@/components/ui/shared";

interface HostelDetail {
  id: string;
  name: string;
  slug: string;
  city: string;
  area?: string | null;
  address: string;
  gender: string;
  pricePerMonth: number;
  rooms: number;
  capacity: number;
  description: string;
  amenities: string[];
  images: string[];
  coverImage?: string | null;
  rules: string[];
  verified: boolean;
  createdAt: string;
  owner: {
    name: string;
    email: string;
    createdAt: string;
    _count: { hostels: number };
  };
  rooms_rel: { id: string; name: string; pricePerMonth: number; capacity: number }[];
}

interface HostelReviewDrawerProps {
  hostelId: string;
  hostelName: string;
  onClose: () => void;
  onApprove: () => void;
  onSuspend: () => void;
  status: string;
  actionLoading: boolean;
}

function formatPKR(n: number) {
  return `Rs. ${n.toLocaleString("en-PK")}`;
}

export function HostelReviewDrawer({
  hostelId,
  hostelName,
  onClose,
  onApprove,
  onSuspend,
  status,
  actionLoading,
}: HostelReviewDrawerProps) {
  // Lock scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const { data, isLoading, isError } = useQuery<{ data: HostelDetail }>({
    queryKey: ["admin-hostel-detail", hostelId],
    queryFn: async () => {
      const res = await fetch(`/api/hostels/${hostelId}`);
      if (!res.ok) throw new Error("Failed to load hostel details");
      return res.json();
    },
  });

  const hostel = data?.data;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[50]"
        style={{ background: "rgba(26,18,10,0.45)" }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Review listing: ${hostelName}`}
        className="fixed right-0 top-0 z-[55] flex h-full w-full max-w-[520px] flex-col shadow-[var(--shadow-xl)]"
        style={{
          background: "var(--color-bg-card)",
          borderLeft: "1px solid var(--color-border-subtle)",
        }}
      >
        {/* Drawer header */}
        <div
          className="flex shrink-0 items-center justify-between gap-3 px-5 py-4"
          style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
        >
          <div className="min-w-0">
            <p className="text-[var(--text-caption)] text-[var(--color-text-muted)] mb-0.5">
              Reviewing listing
            </p>
            <h2
              className="truncate text-[var(--text-body)] font-[600] text-[var(--color-text-heading)]"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {hostelName}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close review panel"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-[var(--color-bg-overlay)]"
            style={{ color: "var(--color-text-muted)" }}
          >
            <X size={16} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && <PageSpinner label="Loading hostel details…" />}
          {isError   && (
            <div className="p-5">
              <InlineError message="Couldn't load hostel details. Try closing and reopening." />
            </div>
          )}
          {hostel && (
            <div className="space-y-0">

              {/* Photo strip */}
              {hostel.images.length > 0 ? (
                <div className="flex gap-1.5 overflow-x-auto p-4 pb-0">
                  {hostel.images.slice(0, 6).map((src, i) => (
                    <div
                      key={src}
                      className="relative shrink-0 overflow-hidden rounded-[var(--radius-md)]"
                      style={{ width: 140, height: 96 }}
                    >
                      <Image
                        src={src}
                        alt={`${hostel.name} photo ${i + 1}`}
                        fill
                        className="object-cover"
                        sizes="140px"
                      />
                      {i === 0 && hostel.coverImage === src && (
                        <span
                          className="absolute left-1 top-1 rounded-sm px-1 text-[9px] font-[700] leading-4"
                          style={{ background: "var(--color-primary)", color: "#fff" }}
                        >
                          Cover
                        </span>
                      )}
                    </div>
                  ))}
                  {hostel.images.length > 6 && (
                    <div
                      className="flex shrink-0 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-caption)] text-[var(--color-text-muted)]"
                      style={{
                        width: 140, height: 96,
                        background: "var(--color-bg-overlay)",
                        border: "1px solid var(--color-border-subtle)",
                      }}
                    >
                      +{hostel.images.length - 6} more
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="mx-4 mt-4 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--text-body-sm)] text-[var(--color-text-muted)]"
                  style={{
                    height: 96,
                    background: "var(--color-bg-overlay)",
                    border: "1px dashed var(--color-border-default)",
                  }}
                >
                  No photos uploaded
                </div>
              )}

              {/* Key facts row */}
              <div className="grid grid-cols-3 gap-px mt-4 mx-4 overflow-hidden rounded-[var(--radius-md)]"
                   style={{ border: "1px solid var(--color-border-subtle)" }}>
                {[
                  { label: "Price", value: `${formatPKR(hostel.pricePerMonth)}/mo` },
                  { label: "Rooms", value: `${hostel.rooms} rooms` },
                  { label: "Capacity", value: `${hostel.capacity} beds` },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center py-3 px-2 text-center"
                    style={{ background: "var(--color-bg-sidebar)" }}
                  >
                    <span className="text-[var(--text-body-sm)] font-[600] text-[var(--color-text-heading)]">
                      {value}
                    </span>
                    <span className="text-[var(--text-caption)] text-[var(--color-text-muted)] mt-0.5">
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Section: Details */}
              <section className="px-4 pt-4 space-y-3">
                <h3 className="text-[var(--text-label)] font-[600] text-[var(--color-text-muted)] uppercase tracking-wide">
                  Details
                </h3>
                <dl className="space-y-2">
                  {[
                    { label: "City",    icon: <MapPin size={13} />, value: `${hostel.city}${hostel.area ? `, ${hostel.area}` : ""}` },
                    { label: "Address", icon: <MapPin size={13} />, value: hostel.address },
                    { label: "Gender",  icon: <Users  size={13} />, value: hostel.gender },
                    { label: "Beds",    icon: <BedDouble size={13} />, value: `${hostel.capacity} total` },
                  ].map(({ label, icon, value }) => (
                    <div key={label} className="flex gap-2 items-start">
                      <span
                        className="mt-0.5 shrink-0"
                        style={{ color: "var(--color-text-muted)" }}
                        aria-hidden="true"
                      >
                        {icon}
                      </span>
                      <span className="text-[var(--text-body-sm)] text-[var(--color-text-body)]">
                        {value}
                      </span>
                    </div>
                  ))}
                </dl>
              </section>

              {/* Section: Description */}
              <section className="px-4 pt-4 space-y-2">
                <h3 className="text-[var(--text-label)] font-[600] text-[var(--color-text-muted)] uppercase tracking-wide">
                  Description
                </h3>
                <p className="text-[var(--text-body-sm)] text-[var(--color-text-body)] leading-relaxed whitespace-pre-wrap">
                  {hostel.description || <em style={{ color: "var(--color-text-muted)" }}>No description provided.</em>}
                </p>
              </section>

              {/* Section: Amenities */}
              {hostel.amenities.length > 0 && (
                <section className="px-4 pt-4 space-y-2">
                  <h3 className="text-[var(--text-label)] font-[600] text-[var(--color-text-muted)] uppercase tracking-wide">
                    Amenities ({hostel.amenities.length})
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {hostel.amenities.map((a) => (
                      <span
                        key={a}
                        className="inline-flex h-6 items-center px-2.5 rounded-full text-[var(--text-caption)] font-[500]"
                        style={{
                          background:  "var(--color-primary-faint)",
                          color:       "var(--color-primary-deep)",
                          border:      "1px solid var(--color-primary-light)",
                        }}
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* Section: Rules */}
              {hostel.rules.length > 0 && (
                <section className="px-4 pt-4 space-y-2">
                  <h3 className="text-[var(--text-label)] font-[600] text-[var(--color-text-muted)] uppercase tracking-wide">
                    House rules
                  </h3>
                  <ul className="space-y-1">
                    {hostel.rules.map((r) => (
                      <li
                        key={r}
                        className="flex gap-2 text-[var(--text-body-sm)] text-[var(--color-text-body)]"
                      >
                        <span style={{ color: "var(--color-text-muted)" }} aria-hidden="true">·</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Section: Owner */}
              <section className="px-4 pt-4 pb-4 space-y-2">
                <h3 className="text-[var(--text-label)] font-[600] text-[var(--color-text-muted)] uppercase tracking-wide">
                  Owner
                </h3>
                <div
                  className="flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5"
                  style={{ background: "var(--color-bg-sidebar)", border: "1px solid var(--color-border-subtle)" }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--text-body-sm)] font-[600] text-[var(--color-text-heading)] flex items-center gap-1.5">
                      {hostel.owner.name}
                      {hostel.verified && (
                        <ShieldCheck size={13} className="text-[var(--color-primary)]" aria-label="Verified owner" />
                      )}
                    </p>
                    <p className="text-[var(--text-caption)] text-[var(--color-text-muted)] truncate">
                      {hostel.owner.email}
                    </p>
                    <p className="text-[var(--text-caption)] text-[var(--color-text-muted)] mt-0.5">
                      {hostel.owner._count.hostels} listing{hostel.owner._count.hostels !== 1 ? "s" : ""} total
                    </p>
                  </div>
                  <Star size={15} strokeWidth={1.5} className="shrink-0" style={{ color: "var(--color-text-muted)" }} aria-hidden="true" />
                </div>

                {/* Open full listing in new tab */}
                <Link
                  href={`/hostels/${hostel.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[var(--text-caption)] font-[500] transition-colors duration-[var(--transition-fast)] hover:underline"
                  style={{ color: "var(--color-primary-deep)" }}
                >
                  <ExternalLink size={11} strokeWidth={1.5} aria-hidden="true" />
                  Open full listing page
                </Link>
              </section>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {status === "PENDING_REVIEW" && (
          <div
            className="flex shrink-0 items-center gap-2 px-5 py-4"
            style={{ borderTop: "1px solid var(--color-border-subtle)" }}
          >
            <button
              onClick={onSuspend}
              disabled={actionLoading}
              className="flex-1 h-9 rounded-[var(--radius-md)] border text-[var(--text-body-sm)] font-[600] transition-colors duration-[var(--transition-fast)] disabled:opacity-50"
              style={{
                borderColor: "var(--color-error)",
                color:       "var(--color-error)",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "var(--color-error)";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--color-error)";
              }}
            >
              Reject & suspend
            </button>
            <button
              onClick={onApprove}
              disabled={actionLoading}
              className="flex-1 h-9 rounded-[var(--radius-md)] text-[var(--text-body-sm)] font-[600] text-white transition-colors duration-[var(--transition-base)] disabled:opacity-50"
              style={{ background: "var(--color-action)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--color-action-dark)")}
              onMouseLeave={e => (e.currentTarget.style.background = "var(--color-action)")}
            >
              Approve & publish
            </button>
          </div>
        )}
      </div>
    </>
  );
}