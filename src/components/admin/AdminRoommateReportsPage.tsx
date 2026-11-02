"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  FormSection,
  secondaryButtonClassName,
} from "@/components/owner/ListingFormFields";
import { readAdminError } from "./adminListings";
import {
  deletePostMessage,
  hasMoreReportedPosts,
  isHiddenFromStudents,
  isPostExpired,
  parseReportedRoommatePostsPage,
  type ReportedRoommatePost,
} from "./adminRoommateReports";

const PAGE_SIZE = 20;

const currencyFormatter = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-PK", {
  dateStyle: "medium",
  timeZone: "Asia/Karachi",
});

const dangerButtonClassName =
  "inline-flex min-h-10 cursor-pointer items-center justify-center rounded-[8px] border-0 bg-[#c13515] px-4 text-[0.85rem] font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25),inset_0_-2px_0_rgb(0_0_0/0.18),0_2px_3px_rgb(15_23_42/0.22)] transition-[background-color,box-shadow,translate] duration-150 hover:bg-[#a52c10] active:translate-y-px active:bg-[#8f240d] active:shadow-[inset_0_3px_6px_rgb(0_0_0/0.3)] disabled:cursor-wait disabled:opacity-60 disabled:shadow-none disabled:active:translate-y-0 motion-reduce:transition-none motion-reduce:active:translate-y-0 focus-visible:outline-2! focus-visible:outline-brand!";

export interface DeleteResult {
  /** Error to show on the card; null when the post was deleted. */
  error: string | null;
}

export type DeletePostAction = (
  post: ReportedRoommatePost,
) => Promise<DeleteResult>;

export function DeleteForm({
  post,
  busy,
  error,
  onConfirm,
  onCancel,
}: {
  post: ReportedRoommatePost;
  busy: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="grid gap-3 rounded-[12px] bg-surface-muted p-4">
      <p className="m-0 text-[0.9rem] text-ink">
        Delete this post permanently? Its{" "}
        {post.reportCount === 1 ? "report is" : `${post.reportCount} reports are`}{" "}
        deleted with it. The author is not notified, and this cannot be undone.
      </p>
      {error ? (
        <p className="m-0 text-[0.875rem] text-[#c13515]" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          className={dangerButtonClassName}
          disabled={busy}
          onClick={onConfirm}
          type="button"
        >
          {busy ? "Working…" : "Delete post"}
        </button>
        <button
          className={secondaryButtonClassName}
          disabled={busy}
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function ReportedPostCard({
  post,
  hideThreshold,
  now,
  onDelete,
}: {
  post: ReportedRoommatePost;
  hideThreshold: number;
  now: number;
  onDelete: DeletePostAction;
}) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hidden = isHiddenFromStudents(post.reportCount, hideThreshold);
  const expired = isPostExpired(post.expiresAt, now);

  async function confirm() {
    setBusy(true);
    setError(null);
    const result = await onDelete(post);
    // On success the parent removes this card, so only failures need state.
    setBusy(false);
    if (result.error) setError(result.error);
  }

  return (
    <li className="grid gap-3 rounded-[14px] border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="m-0 text-[1.02rem] font-semibold text-ink">
          {post.authorName}
        </h3>
        <span className="rounded-full bg-[#fbf4e6] px-[10px] py-[2px] text-[0.72rem] font-bold text-[#583c13]">
          {post.reportCount} {post.reportCount === 1 ? "report" : "reports"}
        </span>
        <span
          className={`rounded-full px-[10px] py-[2px] text-[0.72rem] font-bold ${hidden ? "bg-surface-muted text-muted" : "bg-brand-soft text-brand-dark"}`}
        >
          {hidden ? "Hidden from students" : "Still visible"}
        </span>
        {expired ? (
          <span className="rounded-full bg-surface-muted px-[10px] py-[2px] text-[0.72rem] font-bold text-muted">
            Expired
          </span>
        ) : null}
      </div>
      <p className="m-0 text-[0.85rem] text-muted">
        On{" "}
        <Link
          className="font-semibold text-brand hover:underline"
          href={`/hostels/${encodeURIComponent(post.hostelSlug)}`}
        >
          {post.hostelName}
        </Link>{" "}
        · posted {dateFormatter.format(new Date(post.createdAt))}
        {post.budget !== null
          ? ` · ${currencyFormatter.format(post.budget)} / month`
          : ""}
        {post.moveIn
          ? ` · move-in ${dateFormatter.format(new Date(post.moveIn))}`
          : ""}
      </p>
      <p className="m-0 whitespace-pre-line text-[0.9rem] text-ink">
        {post.bio}
      </p>

      <div className="grid gap-2 rounded-[12px] border border-line p-4">
        <h4 className="m-0 text-[0.9rem] font-semibold text-ink">Reports</h4>
        <ul className="m-0 grid list-none gap-2 p-0">
          {post.reports.map((report) => (
            <li className="grid gap-[2px] text-[0.88rem]" key={report.id}>
              <span className="whitespace-pre-line text-ink">
                {report.reason}
              </span>
              <span className="text-[0.78rem] text-muted">
                {report.reporterName} ·{" "}
                {dateFormatter.format(new Date(report.createdAt))}
              </span>
            </li>
          ))}
        </ul>
        {post.reportCount > post.reports.length ? (
          <p className="m-0 text-[0.78rem] text-muted">
            Showing the latest {post.reports.length} of {post.reportCount}{" "}
            reports.
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          className={secondaryButtonClassName}
          onClick={() => setConfirming((open) => !open)}
          type="button"
        >
          Delete post
        </button>
      </div>

      {confirming ? (
        <DeleteForm
          busy={busy}
          error={error}
          onCancel={() => {
            setConfirming(false);
            setError(null);
          }}
          onConfirm={() => void confirm()}
          post={post}
        />
      ) : null}
    </li>
  );
}

export interface AdminRoommateReportsContentProps {
  posts: ReportedRoommatePost[];
  total: number;
  hideThreshold: number;
  /** Epoch ms when the list was loaded; used to flag expired posts. */
  now: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  loadError: string | null;
  moreError: string | null;
  notice: { tone: "success" | "error"; text: string } | null;
  onRetry: () => void;
  onLoadMore: () => void;
  onDelete: DeletePostAction;
}

export function AdminRoommateReportsContent({
  posts,
  total,
  hideThreshold,
  now,
  hasMore,
  isLoading,
  isLoadingMore,
  loadError,
  moreError,
  notice,
  onRetry,
  onLoadMore,
  onDelete,
}: AdminRoommateReportsContentProps) {
  return (
    <main className="mx-auto w-[min(760px,calc(100%-var(--page-gutter-mobile)))] pb-16 pt-8 md:pt-10">
      <Link
        className="text-[0.85rem] font-semibold text-brand hover:underline"
        href="/admin"
      >
        ← Back to admin console
      </Link>
      <h1 className="mb-0 mt-3 text-[clamp(1.6rem,3vw,2.1rem)] font-semibold tracking-[-0.035em] text-ink">
        Roommate reports
      </h1>
      <p className="mb-6 mt-2 text-[0.95rem] text-muted">
        Review roommate posts that students have reported. A post is hidden
        from students once it reaches {hideThreshold} reports. Deleting is the
        only action available, and reports cannot be dismissed.
      </p>

      <div className="grid gap-5">
        {notice ? (
          <p
            className={`m-0 rounded-[14px] px-[13px] py-[11px] text-[0.875rem] ${notice.tone === "success" ? "bg-brand-soft text-brand-dark" : "bg-surface-muted text-[#c13515]"}`}
            role={notice.tone === "success" ? "status" : "alert"}
          >
            {notice.text}
          </p>
        ) : null}

        <FormSection title="Reported posts">
          {isLoading ? (
            <p className="m-0 text-muted" role="status">
              Loading reported posts...
            </p>
          ) : loadError ? (
            <div className="rounded-[14px] bg-surface-muted p-4" role="alert">
              <p className="m-0 text-[#c13515]">{loadError}</p>
              <button
                className={`${secondaryButtonClassName} mt-3`}
                onClick={onRetry}
                type="button"
              >
                Try again
              </button>
            </div>
          ) : posts.length === 0 ? (
            <p className="m-0 text-[0.92rem] text-muted">
              No roommate posts have been reported.
            </p>
          ) : (
            <>
              <p aria-live="polite" className="m-0 text-[0.85rem] text-muted">
                {total} reported {total === 1 ? "post" : "posts"}
              </p>
              <ul className="m-0 grid list-none gap-3 p-0">
                {posts.map((post) => (
                  <ReportedPostCard
                    hideThreshold={hideThreshold}
                    key={post.id}
                    now={now}
                    onDelete={onDelete}
                    post={post}
                  />
                ))}
              </ul>
            </>
          )}
          {moreError ? (
            <p
              className="m-0 rounded-[14px] bg-surface-muted px-[13px] py-[11px] text-[0.875rem] text-[#c13515]"
              role="alert"
            >
              {moreError}
            </p>
          ) : null}
          {hasMore ? (
            <div className="text-center">
              <button
                className={secondaryButtonClassName}
                disabled={isLoadingMore}
                onClick={onLoadMore}
                type="button"
              >
                {isLoadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          ) : null}
        </FormSection>
      </div>
    </main>
  );
}

async function fetchReportedPosts(page: number, signal?: AbortSignal) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(PAGE_SIZE),
  });
  const response = await fetch(`/api/admin/roommate-reports?${params.toString()}`, {
    signal,
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(readAdminError(payload, "Could not load reported posts."));
  }
  const parsed = parseReportedRoommatePostsPage(payload);
  if (!parsed) throw new Error("Could not load reported posts.");
  return parsed;
}

export function AdminRoommateReportsPage() {
  const [posts, setPosts] = useState<ReportedRoommatePost[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hideThreshold, setHideThreshold] = useState(3);
  const [now, setNow] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [moreError, setMoreError] = useState<string | null>(null);
  const [notice, setNotice] = useState<
    { tone: "success" | "error"; text: string } | null
  >(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setLoadError(null);
    setMoreError(null);
    fetchReportedPosts(1, controller.signal)
      .then((result) => {
        setPosts(result.data);
        setTotal(result.total);
        setPage(result.page);
        setHideThreshold(result.hideThreshold);
        setNow(Date.now());
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(
          error instanceof Error ? error.message : "Could not load reported posts.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [retryCount]);

  const loadMore = useCallback(async () => {
    setIsLoadingMore(true);
    setMoreError(null);
    try {
      const result = await fetchReportedPosts(page + 1);
      setPosts((current) => {
        const seen = new Set(current.map((item) => item.id));
        return [...current, ...result.data.filter((item) => !seen.has(item.id))];
      });
      setTotal(result.total);
      setPage(result.page);
      setHideThreshold(result.hideThreshold);
      setNow(Date.now());
    } catch (error) {
      setMoreError(
        error instanceof Error
          ? error.message
          : "Could not load more reported posts.",
      );
    } finally {
      setIsLoadingMore(false);
    }
  }, [page]);

  const deletePost = useCallback<DeletePostAction>(async (post) => {
    try {
      const response = await fetch(
        `/api/admin/roommate-reports/${encodeURIComponent(post.id)}`,
        { method: "DELETE" },
      );
      if (response.ok) {
        setPosts((current) => current.filter((item) => item.id !== post.id));
        setTotal((current) => Math.max(0, current - 1));
        setNotice({
          tone: "success",
          text: deletePostMessage(post.authorName, post.hostelName),
        });
        return { error: null };
      }
      const payload: unknown = await response.json().catch(() => null);
      const message = readAdminError(
        payload,
        "We couldn't delete this post. Please try again.",
      );
      if (response.status === 404) {
        // Another admin already removed it; show the fresh list.
        setNotice({ tone: "error", text: message });
        setRetryCount((count) => count + 1);
      }
      return { error: message };
    } catch {
      return { error: "We couldn't delete this post. Please try again." };
    }
  }, []);

  return (
    <AdminRoommateReportsContent
      hasMore={hasMoreReportedPosts(page, PAGE_SIZE, total)}
      hideThreshold={hideThreshold}
      isLoading={isLoading}
      isLoadingMore={isLoadingMore}
      loadError={loadError}
      moreError={moreError}
      notice={notice}
      now={now}
      onDelete={deletePost}
      onLoadMore={() => void loadMore()}
      onRetry={() => setRetryCount((count) => count + 1)}
      posts={posts}
      total={total}
    />
  );
}
