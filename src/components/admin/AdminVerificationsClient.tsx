"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ShieldCheck, ShieldX, ExternalLink, Loader2, Users } from "lucide-react";
import { EmptyState, PageSpinner } from "@/components/ui/shared";
import { toast } from "sonner";

interface PendingUser {
  id: string;
  name: string;
  email: string;
  city: string | null;
  verificationDocUrl: string;
  verificationSubmittedAt: string;
  _count: { bookings: number };
}

export function AdminVerificationsClient() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<{ data: PendingUser[] }>({
    queryKey: ["admin-verifications"],
    queryFn: () => fetch("/api/admin/verifications").then((r) => r.json()),
  });

  const actionMutation = useMutation({
    mutationFn: ({ userId, action }: { userId: string; action: "approve" | "reject" }) =>
      fetch("/api/admin/verifications", {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ userId, action }),
      }).then((r) => r.json()),
    onSuccess: (_, { action }) => {
      toast.success(action === "approve" ? "Student verified." : "Verification rejected.");
      qc.invalidateQueries({ queryKey: ["admin-verifications"] });
    },
    onError: () => toast.error("Action failed — please try again."),
  });

  if (isLoading) return <PageSpinner />;

  const users = data?.data ?? [];

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-[var(--text-h4)] font-[700] text-[var(--color-text-heading)]"
            style={{ fontFamily: "var(--font-heading)" }}>
          Student verifications
        </h1>
        {users.length > 0 && (
          <span className="text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
            {users.length} pending
          </span>
        )}
      </div>

      {users.length === 0 ? (
        <EmptyState
          icon={Users}
          heading="No pending verifications"
          description="All student verification requests have been reviewed."
        />
      ) : (
        <div className="space-y-3" role="list">
          {users.map((user) => (
            <div
              key={user.id}
              role="listitem"
              className="flex items-start gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-4"
            >
              {/* User info */}
              <div className="flex-1 min-w-0 space-y-0.5">
                <p className="text-[var(--text-body-sm)] font-[600] text-[var(--color-text-heading)]">
                  {user.name}
                </p>
                <p className="text-[var(--text-caption)] text-[var(--color-text-muted)]">
                  {user.email}{user.city ? ` · ${user.city}` : ""}
                </p>
                <p className="text-[var(--text-caption)] text-[var(--color-text-muted)]">
                  {user._count.bookings} booking{user._count.bookings !== 1 ? "s" : ""}
                  {" · "}Submitted {format(parseISO(user.verificationSubmittedAt), "d MMM yyyy")}
                </p>
                
                <a
                  href={user.verificationDocUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[var(--text-caption)] text-[var(--color-text-link)] hover:underline mt-1"
                >
                  <ExternalLink size={11} strokeWidth={1.5} aria-hidden="true" />
                  View document
                </a>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => actionMutation.mutate({ userId: user.id, action: "reject" })}
                  disabled={actionMutation.isPending}
                  aria-label={`Reject ${user.name}'s verification`}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] text-[var(--text-body-sm)] text-[var(--color-text-muted)] hover:border-[var(--color-error)] hover:text-[var(--color-error)] transition-colors disabled:opacity-40"
                >
                  <ShieldX size={14} strokeWidth={1.5} aria-hidden="true" />
                  Reject
                </button>
                <button
                  onClick={() => actionMutation.mutate({ userId: user.id, action: "approve" })}
                  disabled={actionMutation.isPending}
                  aria-label={`Approve ${user.name}'s verification`}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white text-[var(--text-body-sm)] font-[500] hover:bg-[var(--color-primary-deep)] transition-colors disabled:opacity-40"
                >
                  {actionMutation.isPending
                    ? <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
                    : <ShieldCheck size={14} strokeWidth={1.5} aria-hidden="true" />}
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
