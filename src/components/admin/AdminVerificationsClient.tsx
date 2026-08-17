"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import {
  ShieldCheck,
  ShieldX,
  ExternalLink,
  Loader2,
  Users,
  Search,
  FileWarning,
} from "lucide-react";
import { EmptyState, PageSpinner } from "@/components/ui/shared";
import { toast } from "sonner";

type StatusTab = "PENDING" | "APPROVED" | "REJECTED";

interface VerificationUser {
  id: string;
  name: string;
  email: string;
  city: string | null;
  verificationDocUrl: string | null;
  verificationSubmittedAt: string;
  _count: { bookings: number };
}

const TABS: { key: StatusTab; label: string }[] = [
  { key: "PENDING",  label: "Pending" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
];

const REJECT_REASONS = [
  "Image is blurry or unreadable",
  "Document appears expired",
  "Name doesn't match account name",
  "Not a valid student ID or enrolment letter",
  "Other",
];

// Rotating avatar tint, keyed off user id so it's stable across re-renders/re-fetches
const AVATAR_TINTS = [
  { bg: "var(--color-primary-faint)",           text: "var(--color-primary-deep)" },
  { bg: "var(--color-secondary-brand-container)", text: "var(--color-secondary-brand)" },
  { bg: "var(--color-tertiary-brand-container)",  text: "var(--color-tertiary-brand)" },
  { bg: "var(--color-bg-overlay)",              text: "var(--color-text-muted)" },
];
function avatarTint(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_TINTS[hash % AVATAR_TINTS.length];
}

function StatusPill({ status }: { status: StatusTab }) {
  const styles: Record<StatusTab, string> = {
    PENDING:  "bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]",
    APPROVED: "bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
    REJECTED: "bg-[var(--color-error-bg)] text-[var(--color-error-text)]",
  };
  const labels: Record<StatusTab, string> = {
    PENDING: "Pending", APPROVED: "Approved", REJECTED: "Rejected",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[var(--text-caption)] font-[600] ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export function AdminVerificationsClient() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<StatusTab>("PENDING");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading } = useQuery<{ data: VerificationUser[] }>({
    queryKey: ["admin-verifications", tab],
    queryFn: () => fetch(`/api/admin/verifications?status=${tab}`).then((r) => r.json()),
  });

  const users = useMemo(() => {
    const list = data?.data ?? [];
    if (!query.trim()) return list;
    const q = query.trim().toLowerCase();
    return list.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [data, query]);

  const selected = users.find((u) => u.id === selectedId) ?? users[0] ?? null;

  const actionMutation = useMutation({
    mutationFn: ({ userId, action, reason }: { userId: string; action: "approve" | "reject"; reason?: string }) =>
      fetch("/api/admin/verifications", {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ userId, action, reason }),
      }).then((r) => r.json()),
    onSuccess: (_, { action }) => {
      toast.success(action === "approve" ? "Student verified." : "Verification rejected.");
      setSelectedId(null);
      setRejectReason("");
      qc.invalidateQueries({ queryKey: ["admin-verifications"] });
    },
    onError: () => toast.error("Action failed — please try again."),
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-[var(--text-h1)] font-[800] text-[var(--color-text-heading)]">
            Student Verifications
          </h1>
          {tab === "PENDING" && (
            <p className="mt-1 flex items-center gap-1.5 text-[var(--text-body-sm)] text-[var(--color-warning-text)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-warning)]" aria-hidden="true" />
              {data?.data?.length ?? 0} Pending Requests
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/verifications/analytics"
            className="text-[var(--text-body-sm)] font-[600] text-[var(--color-text-link)] hover:underline"
          >
            View analytics →
          </Link>
          <div className="flex gap-1 rounded-[var(--radius-md)] bg-[var(--color-bg-sidebar)] p-1">
            {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setTab(key); setSelectedId(null); setRejectReason(""); }}
              className={`rounded-[var(--radius-sm)] px-3.5 py-1.5 text-[var(--text-body-sm)] font-[600] transition-colors duration-[var(--transition-fast)] ${
                tab === key
                  ? "bg-[var(--color-bg-card)] text-[var(--color-primary)] shadow-[var(--shadow-xs)]"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-body)]"
              }`}
            >
              {label}
            </button>
          ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        {/* -- Queue ------------------------------------- */}
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] px-4 py-3">
            <p className="text-[var(--text-body-sm)] font-[600] text-[var(--color-text-heading)]">
              Queue ({users.length})
            </p>
            <div className="relative w-48">
              <Search size={13} strokeWidth={2} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search verifications…"
                aria-label="Search verifications"
                className="w-full rounded-[var(--radius-full)] border border-[var(--color-border-default)] bg-[var(--color-bg-sidebar)] py-1 pl-7 pr-3 text-[var(--text-caption)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-placeholder)] focus:outline-none focus:border-[var(--color-primary)]"
              />
            </div>
          </div>

          {isLoading ? (
            <PageSpinner />
          ) : users.length === 0 ? (
            <EmptyState
              icon={Users}
              heading={query ? "No matches" : `No ${tab.toLowerCase()} verifications`}
              description={query ? "Try a different search." : "There's nothing here right now."}
            />
          ) : (
            <div role="list">
              {users.map((user) => {
                const tint = avatarTint(user.id);
                const isActive = selected?.id === user.id;
                return (
                  <button
                    key={user.id}
                    role="listitem"
                    onClick={() => { setSelectedId(user.id); setRejectReason(""); }}
                    aria-current={isActive ? "true" : undefined}
                    className={`flex w-full items-center gap-3 border-b border-[var(--color-border-subtle)] px-4 py-3.5 text-left transition-colors duration-[var(--transition-fast)] last:border-b-0 ${
                      isActive ? "border-l-[3px] border-l-[var(--color-primary)] bg-[var(--color-primary-faint)]" : "border-l-[3px] border-l-transparent hover:bg-[var(--color-bg-overlay)]"
                    }`}
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-[700]"
                      style={{ backgroundColor: tint.bg, color: tint.text }}
                    >
                      {user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[var(--text-body-sm)] font-[600] text-[var(--color-text-heading)]">
                        {user.name}
                      </p>
                      <p className="truncate text-[var(--text-caption)] text-[var(--color-text-muted)]">
                        {user.email}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[var(--text-caption)] text-[var(--color-text-muted)]">
                        Submitted<br />{format(parseISO(user.verificationSubmittedAt), "MMM d, yyyy")}
                      </p>
                    </div>
                    <StatusPill status={tab} />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* -- Review panel -------------------------------- */}
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] overflow-hidden self-start">
          <div className="border-b border-[var(--color-border-subtle)] px-4 py-3">
            <p className="text-[var(--text-body-sm)] font-[600] text-[var(--color-text-heading)]">Review Request</p>
          </div>

          {!selected ? (
            <p className="px-4 py-10 text-center text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
              Select a request to review it.
            </p>
          ) : (
            <div className="p-4 space-y-4">
              {selected.verificationDocUrl ? (
                <img
                  src={selected.verificationDocUrl}
                  alt={`Verification document submitted by ${selected.name}`}
                  className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-default)] bg-[var(--color-bg-sidebar)] py-8 text-center">
                  <FileWarning size={22} strokeWidth={1.5} className="text-[var(--color-text-muted)]" aria-hidden="true" />
                  <p className="max-w-[220px] text-[var(--text-caption)] text-[var(--color-text-muted)]">
                    {tab === "REJECTED"
                      ? "Document was cleared after rejection so the student can resubmit cleanly."
                      : "No document on file."}
                  </p>
                </div>
              )}

              <div className="rounded-[var(--radius-md)] bg-[var(--color-bg-sidebar)] p-3.5 space-y-2.5">
                <p className="text-[var(--text-caption)] font-[700] uppercase tracking-[0.05em] text-[var(--color-text-muted)]">
                  Applicant details
                </p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
                  <div>
                    <p className="text-[var(--text-caption)] text-[var(--color-text-muted)]">Full name</p>
                    <p className="text-[var(--text-body-sm)] font-[600] text-[var(--color-text-heading)]">{selected.name}</p>
                  </div>
                  <div>
                    <p className="text-[var(--text-caption)] text-[var(--color-text-muted)]">City</p>
                    <p className="text-[var(--text-body-sm)] font-[600] text-[var(--color-text-heading)]">{selected.city ?? "—"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[var(--text-caption)] text-[var(--color-text-muted)]">Email</p>
                    <p className="truncate text-[var(--text-body-sm)] font-[600] text-[var(--color-text-heading)]">{selected.email}</p>
                  </div>
                  <div>
                    <p className="text-[var(--text-caption)] text-[var(--color-text-muted)]">Submitted</p>
                    <p className="text-[var(--text-body-sm)] font-[600] text-[var(--color-text-heading)]">
                      {format(parseISO(selected.verificationSubmittedAt), "d MMM yyyy")}
                    </p>
                  </div>
                  <div>
                    <p className="text-[var(--text-caption)] text-[var(--color-text-muted)]">Bookings</p>
                    <p className="text-[var(--text-body-sm)] font-[600] text-[var(--color-text-heading)]">{selected._count.bookings}</p>
                  </div>
                </div>
                {selected.verificationDocUrl && (
                  <a
                    href={selected.verificationDocUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[var(--text-caption)] text-[var(--color-text-link)] hover:underline"
                  >
                    <ExternalLink size={11} strokeWidth={1.5} aria-hidden="true" />
                    Open full-size document
                  </a>
                )}
              </div>

              {tab === "PENDING" && (
                <>
                  <div className="space-y-1.5 text-[var(--text-caption)] text-[var(--color-text-muted)]">
                    <p className="font-[600] text-[var(--color-text-body)]">Before you approve, check:</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Name on the document matches the account name</li>
                      <li>Photo is legible and document isn't expired</li>
                      <li>It's a genuine student ID or enrolment letter</li>
                    </ul>
                  </div>

                  <button
                    onClick={() => actionMutation.mutate({ userId: selected.id, action: "approve" })}
                    disabled={actionMutation.isPending}
                    className="flex w-full items-center justify-center gap-2 h-10 rounded-[var(--radius-md)] bg-[var(--color-action)] text-white text-[var(--text-body-sm)] font-[600] hover:bg-[var(--color-action-dark)] transition-colors duration-[var(--transition-base)] disabled:opacity-50"
                  >
                    {actionMutation.isPending ? (
                      <Loader2 size={15} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />
                    ) : (
                      <ShieldCheck size={15} strokeWidth={1.5} aria-hidden="true" />
                    )}
                    Approve Verification
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={() => actionMutation.mutate({ userId: selected.id, action: "reject", reason: rejectReason || undefined })}
                      disabled={actionMutation.isPending}
                      className="inline-flex items-center gap-1.5 h-9 flex-1 justify-center rounded-[var(--radius-md)] border border-[var(--color-border-default)] text-[var(--text-body-sm)] font-[500] text-[var(--color-text-body)] hover:border-[var(--color-error)] hover:text-[var(--color-error)] transition-colors disabled:opacity-40"
                    >
                      <ShieldX size={14} strokeWidth={1.5} aria-hidden="true" />
                      Reject
                    </button>
                    <select
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      aria-label="Rejection reason"
                      className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] px-2 text-[var(--text-caption)] text-[var(--color-text-body)] focus:outline-none focus:border-[var(--color-primary)]"
                    >
                      <option value="">Reason…</option>
                      {REJECT_REASONS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
