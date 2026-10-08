"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { ExternalLink, Flag, Loader2, Trash2 } from "lucide-react";
import { EmptyState, InlineError, PageSpinner } from "@/components/ui/shared";
import { Pagination } from "@/components/hostel/Pagination";

const PAGE_SIZE = 20;

interface ReportedPost {
  id: string;
  bio: string;
  budget: number | null;
  moveIn: string | null;
  createdAt: string;
  expiresAt: string;
  hostel: { id: string; name: string; slug: string };
  user: { id: string; name: string | null };
  reports: {
    id: string;
    reason: string;
    createdAt: string;
    reporter: { id: string; name: string | null };
  }[];
  _count: { reports: number };
}

interface QueueData {
  data: ReportedPost[];
  total: number;
  page: number;
  limit: number;
  hideThreshold: number;
}

function RemoveReportedPostButton({
  postId,
  armed,
  loading,
  onArm,
  onCancel,
  onConfirm,
}: {
  postId: string;
  armed: boolean;
  loading: boolean;
  onArm: (id: string) => void;
  onCancel: () => void;
  onConfirm: (id: string) => void;
}) {
  if (armed) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onConfirm(postId)}
          disabled={loading}
          className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--color-error)] px-3 text-[length:var(--text-caption)] font-[600] text-[color:var(--color-text-inverse)] hover:opacity-90 disabled:opacity-50"
        >
          {loading && <Loader2 size={13} className="animate-spin" aria-hidden="true" />}
          Confirm removal
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-[length:var(--text-caption)] text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-body)]"
        >
          Keep
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onArm(postId)}
      className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border-default)] px-3 text-[length:var(--text-caption)] font-[600] text-[color:var(--color-error)] hover:bg-[var(--color-error-bg)]"
    >
      <Trash2 size={13} aria-hidden="true" />
      Remove post
    </button>
  );
}

export default function AdminRoommateReportsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [armedId, setArmedId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery<QueueData>({
    queryKey: ["admin-roommate-reports", page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      const response = await fetch(`/api/admin/roommate-reports?${params}`);
      if (!response.ok) throw new Error("Failed to load roommate reports");
      return response.json();
    },
    placeholderData: (previous) => previous,
  });

  const removeMutation = useMutation({
    mutationFn: async (postId: string) => {
      const response = await fetch(`/api/admin/roommate-reports/${postId}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not remove post");
      return result;
    },
    onSuccess: () => {
      toast.success("Reported post removed.");
      setArmedId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-roommate-reports"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isLoading) return <PageSpinner label="Loading roommate reports…" />;
  if (isError || !data) return <InlineError message="Couldn't load roommate reports. Please refresh." />;

  const totalPages = Math.ceil(data.total / PAGE_SIZE);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)]">
          Review reported roommate posts. Posts are hidden from students once they reach {data.hideThreshold} reports.
        </p>
        <p className="mt-1 text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">
          {data.total} reported post{data.total === 1 ? "" : "s"}
        </p>
      </div>

      {data.data.length === 0 ? (
        <EmptyState
          icon={Flag}
          heading="No reported posts"
          description="Roommate posts that receive reports will appear here for review."
        />
      ) : (
        <div className="space-y-4">
          {data.data.map((post) => {
            const hidden = post._count.reports >= data.hideThreshold;
            return (
              <article
                key={post.id}
                className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-4 md:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-[700] text-[color:var(--color-text-heading)]">
                        {post.hostel.name}
                      </h2>
                      <span className={`rounded-full px-2 py-0.5 text-[length:var(--text-caption)] font-[600] ${
                        hidden
                          ? "bg-[var(--color-error-bg)] text-[color:var(--color-error)]"
                          : "bg-[var(--color-warning-bg)] text-[color:var(--color-warning-text)]"
                      }`}>
                        {post._count.reports} report{post._count.reports === 1 ? "" : "s"}{hidden ? " · hidden" : ""}
                      </span>
                    </div>
                    <p className="mt-1 text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">
                      By {post.user.name ?? "Student"} · posted {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <Link
                    href={`/hostels/${post.hostel.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-[length:var(--text-caption)] font-[600] text-[color:var(--color-text-link)] hover:underline"
                  >
                    View hostel <ExternalLink size={13} aria-hidden="true" />
                  </Link>
                </div>

                <p className="mt-4 whitespace-pre-wrap break-words text-[length:var(--text-body-sm)] text-[color:var(--color-text-body)]">
                  {post.bio}
                </p>
                <p className="mt-2 text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">
                  {post.budget ? `Budget: PKR ${post.budget.toLocaleString()} / month` : "No budget listed"}
                  {post.moveIn ? ` · Move-in: ${new Date(post.moveIn).toLocaleDateString()}` : ""}
                </p>

                <div className="mt-4 border-t border-[var(--color-border-subtle)] pt-3">
                  <h3 className="text-[length:var(--text-label)] font-[700] text-[color:var(--color-text-heading)]">
                    Report reasons
                  </h3>
                  <ul className="mt-2 space-y-2">
                    {post.reports.map((report) => (
                      <li key={report.id} className="rounded-[var(--radius-sm)] bg-[var(--color-bg-overlay)] px-3 py-2">
                        <p className="text-[length:var(--text-body-sm)] text-[color:var(--color-text-body)]">{report.reason}</p>
                        <p className="mt-1 text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">
                          {report.reporter.name ?? "Student"} · {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 flex justify-end border-t border-[var(--color-border-subtle)] pt-3">
                  <RemoveReportedPostButton
                    postId={post.id}
                    armed={armedId === post.id}
                    loading={removeMutation.isPending && removeMutation.variables === post.id}
                    onArm={setArmedId}
                    onCancel={() => setArmedId(null)}
                    onConfirm={(id) => removeMutation.mutate(id)}
                  />
                </div>
              </article>
            );
          })}
          {totalPages > 1 && (
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </div>
      )}
    </div>
  );
}
