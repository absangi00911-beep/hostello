"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { formatPrice } from "@hostello/shared";

export interface RoommatePost {
  id: string;
  bio: string;
  budget: number | null;
  moveIn: string | null;
  expiresAt: string;
  userId: string;
  user: { name: string; city: string | null };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPost(value: unknown): value is Record<string, unknown> & {
  id: string;
  bio: string;
  expiresAt: string;
  userId: string;
  user: Record<string, unknown> & { name: string };
} {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.bio === "string" &&
    typeof value.expiresAt === "string" &&
    typeof value.userId === "string" &&
    isRecord(value.user) &&
    typeof value.user.name === "string"
  );
}

export function parsePosts(value: unknown): RoommatePost[] | null {
  if (!isRecord(value) || !Array.isArray(value.data)) return null;
  if (!value.data.every(isPost)) return null;
  return value.data.map((post) => ({
    id: post.id,
    bio: post.bio,
    budget: typeof post.budget === "number" ? post.budget : null,
    moveIn: typeof post.moveIn === "string" ? post.moveIn : null,
    expiresAt: post.expiresAt,
    userId: post.userId,
    user: {
      name: post.user.name,
      city: typeof post.user.city === "string" ? post.user.city : null,
    },
  }));
}

export function validatePostInput(input: {
  bio: string;
  budget: string;
}): string | null {
  if (!input.bio.trim()) return "Tell other students a little about yourself.";
  if (input.bio.trim().length > 200) return "Keep your bio under 200 characters.";
  if (input.budget.trim() !== "") {
    const budget = Number(input.budget);
    if (!Number.isSafeInteger(budget) || budget <= 0) {
      return "Budget must be a positive whole number of rupees.";
    }
  }
  return null;
}

export function validateReportReason(reason: string): string | null {
  const length = reason.trim().length;
  if (length < 3 || length > 500) {
    return "Describe the problem in 3 to 500 characters.";
  }
  return null;
}

function readApiError(value: unknown, fallback: string): string {
  return isRecord(value) && typeof value.error === "string"
    ? value.error
    : fallback;
}

const dateFormatter = new Intl.DateTimeFormat("en-PK", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const inputClassName =
  "min-h-[44px] w-full rounded-[8px] border border-muted bg-white px-3 text-base text-ink focus-visible:border-brand! focus-visible:outline-brand!";
const buttonClassName =
  "inline-flex min-h-[40px] cursor-pointer items-center justify-center rounded-[8px] border border-line bg-white px-4 text-[0.875rem] font-semibold text-ink shadow-[0_1px_2px_rgb(15_23_42/0.06)] transition-[background-color,border-color,box-shadow,translate] duration-150 enabled:hover:border-[#cbd5e1] enabled:hover:bg-surface-muted active:translate-y-px active:bg-[#e2e8f0] active:shadow-none disabled:shadow-none disabled:active:translate-y-0 motion-reduce:transition-none motion-reduce:active:translate-y-0 disabled:cursor-wait disabled:opacity-70";
const primaryButtonClassName =
  "inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-[8px] border-0 bg-brand px-5 text-[0.95rem] font-[650] text-white enabled:hover:bg-brand-dark disabled:cursor-wait disabled:opacity-70";

export function RoommatesPage({
  currentUserId,
  hostelParam,
}: {
  currentUserId: string;
  hostelParam: string;
}) {
  const endpoint = `/api/hostels/${encodeURIComponent(hostelParam)}/roommates`;
  const [posts, setPosts] = useState<RoommatePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const [bio, setBio] = useState("");
  const [budget, setBudget] = useState("");
  const [moveIn, setMoveIn] = useState("");

  const [reportingId, setReportingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const load = useCallback(
    async (signal?: AbortSignal) => {
      const response = await fetch(endpoint, { signal });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(readApiError(payload, "Could not load roommate posts."));
      }
      const parsed = parsePosts(payload);
      if (!parsed) throw new Error("Could not load roommate posts.");
      return parsed;
    },
    [endpoint],
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal)
      .then((result) => {
        setPosts(result);
        setLoadError(null);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(
          error instanceof Error ? error.message : "Could not load roommate posts.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [load]);

  const ownPost = posts.find((post) => post.userId === currentUserId) ?? null;
  const otherPosts = posts.filter((post) => post.userId !== currentUserId);

  function startEditing(post: RoommatePost) {
    setBio(post.bio);
    setBudget(post.budget === null ? "" : String(post.budget));
    setMoveIn(post.moveIn ? post.moveIn.slice(0, 10) : "");
    setNotice(null);
    setActionError(null);
  }

  async function savePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionError(null);
    setNotice(null);

    const validationError = validatePostInput({ bio, budget });
    if (validationError) {
      setActionError(validationError);
      return;
    }

    setIsBusy(true);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: bio.trim(),
          budget: budget.trim() === "" ? null : Number(budget),
          moveIn: moveIn === "" ? null : moveIn,
        }),
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(readApiError(payload, "Could not save your post."));
      }
      setPosts(await load());
      setNotice("Your post is live for the next 30 days.");
      setBio("");
      setBudget("");
      setMoveIn("");
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Could not save your post.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function deleteOwnPost(post: RoommatePost) {
    setIsBusy(true);
    setActionError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/roommates/${encodeURIComponent(post.id)}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const payload: unknown = await response.json().catch(() => null);
        throw new Error(readApiError(payload, "Could not delete your post."));
      }
      setPosts((current) => current.filter((entry) => entry.id !== post.id));
      setNotice("Your post was deleted.");
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Could not delete your post.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function submitReport(event: FormEvent<HTMLFormElement>, post: RoommatePost) {
    event.preventDefault();
    setActionError(null);
    setNotice(null);

    const reasonError = validateReportReason(reason);
    if (reasonError) {
      setActionError(reasonError);
      return;
    }

    setIsBusy(true);
    try {
      const response = await fetch(
        `/api/roommates/${encodeURIComponent(post.id)}/report`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: reason.trim() }),
        },
      );
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(readApiError(payload, "Could not send your report."));
      }
      setReportingId(null);
      setReason("");
      setNotice("Thanks. Your report was sent to the HostelLo team.");
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Could not send your report.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-[760px] px-4 pb-28 pt-8">
      <Link
        className="text-[0.9rem] font-semibold text-brand hover:underline"
        href={`/hostels/${encodeURIComponent(hostelParam)}`}
      >
        ← Back to hostel
      </Link>
      <h1 className="mb-1 mt-3 text-[1.75rem] font-bold text-ink">
        Roommates for this hostel
      </h1>
      <p className="mb-6 mt-0 text-muted">
        Posts from other students looking for a roommate here. Posts expire
        after 30 days.
      </p>

      {notice ? (
        <p
          className="mb-4 rounded-[14px] bg-brand-soft px-[13px] py-[11px] text-[0.9rem] text-brand-dark"
          role="status"
        >
          {notice}
        </p>
      ) : null}
      {actionError ? (
        <p
          className="mb-4 rounded-[14px] bg-surface-muted px-[13px] py-[11px] text-[0.9rem] text-[#c13515]"
          role="alert"
        >
          {actionError}
        </p>
      ) : null}

      {isLoading ? (
        <p className="text-muted">Loading roommate posts...</p>
      ) : loadError ? (
        <p className="rounded-[14px] bg-surface-muted p-4 text-[#c13515]" role="alert">
          {loadError}
        </p>
      ) : (
        <>
          <section
            aria-label="Your post"
            className="mb-6 rounded-[14px] border border-line bg-surface p-5"
          >
            <h2 className="m-0 mb-3 text-[1.05rem] font-semibold text-ink">
              {ownPost ? "Your post" : "Post that you're looking for a roommate"}
            </h2>

            {ownPost ? (
              <div className="mb-4 rounded-[10px] bg-surface-muted p-3">
                <p className="m-0 text-ink">{ownPost.bio}</p>
                <p className="mb-0 mt-2 text-[0.8rem] text-muted">
                  Expires {dateFormatter.format(new Date(ownPost.expiresAt))}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    className={buttonClassName}
                    disabled={isBusy}
                    onClick={() => startEditing(ownPost)}
                    type="button"
                  >
                    Edit
                  </button>
                  <button
                    className={buttonClassName}
                    disabled={isBusy}
                    onClick={() => deleteOwnPost(ownPost)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : null}

            <form className="grid gap-3" noValidate onSubmit={savePost}>
              <label className="grid gap-1 text-[0.875rem] font-semibold text-ink">
                <span>About you</span>
                <textarea
                  className={`${inputClassName} min-h-[90px] py-2`}
                  maxLength={200}
                  name="bio"
                  onChange={(event) => setBio(event.currentTarget.value)}
                  required
                  value={bio}
                />
                <span className="text-[0.8rem] font-normal text-muted">
                  {bio.trim().length}/200
                </span>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 text-[0.875rem] font-semibold text-ink">
                  <span>
                    Monthly budget (PKR){" "}
                    <span className="font-normal text-muted">(optional)</span>
                  </span>
                  <input
                    className={inputClassName}
                    inputMode="numeric"
                    name="budget"
                    onChange={(event) => setBudget(event.currentTarget.value)}
                    value={budget}
                  />
                </label>
                <label className="grid gap-1 text-[0.875rem] font-semibold text-ink">
                  <span>
                    Move-in date{" "}
                    <span className="font-normal text-muted">(optional)</span>
                  </span>
                  <input
                    className={inputClassName}
                    name="moveIn"
                    onChange={(event) => setMoveIn(event.currentTarget.value)}
                    type="date"
                    value={moveIn}
                  />
                </label>
              </div>
              <button
                className={`${primaryButtonClassName} justify-self-start`}
                disabled={isBusy}
                type="submit"
              >
                {isBusy ? "Saving…" : ownPost ? "Update post" : "Publish post"}
              </button>
            </form>
          </section>

          {otherPosts.length === 0 ? (
            <p className="rounded-[14px] border border-line bg-surface p-6 text-center text-muted">
              No other students have posted here yet.
            </p>
          ) : (
            <ul className="m-0 grid list-none gap-3 p-0">
              {otherPosts.map((post) => (
                <li
                  className="rounded-[14px] border border-line bg-surface p-4"
                  key={post.id}
                >
                  <p className="m-0 font-semibold text-ink">
                    {post.user.name}
                    {post.user.city ? (
                      <span className="font-normal text-muted"> · {post.user.city}</span>
                    ) : null}
                  </p>
                  <p className="mb-0 mt-2 text-ink">{post.bio}</p>
                  <p className="mb-0 mt-2 text-[0.85rem] text-muted">
                    {post.budget !== null ? `Budget ${formatPrice(post.budget)}/month` : null}
                    {post.budget !== null && post.moveIn ? " · " : null}
                    {post.moveIn
                      ? `Move-in ${dateFormatter.format(new Date(post.moveIn))}`
                      : null}
                  </p>

                  {reportingId === post.id ? (
                    <form
                      className="mt-3 grid gap-2"
                      noValidate
                      onSubmit={(event) => submitReport(event, post)}
                    >
                      <label className="grid gap-1 text-[0.8rem] font-semibold text-ink">
                        <span>What's wrong with this post?</span>
                        <textarea
                          className={`${inputClassName} min-h-[70px] py-2`}
                          maxLength={500}
                          onChange={(event) => setReason(event.currentTarget.value)}
                          value={reason}
                        />
                      </label>
                      <div className="flex gap-2">
                        <button className={buttonClassName} disabled={isBusy} type="submit">
                          {isBusy ? "Sending…" : "Send report"}
                        </button>
                        <button
                          className={buttonClassName}
                          disabled={isBusy}
                          onClick={() => {
                            setReportingId(null);
                            setReason("");
                          }}
                          type="button"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      className={`${buttonClassName} mt-3`}
                      disabled={isBusy}
                      onClick={() => {
                        setReportingId(post.id);
                        setReason("");
                        setActionError(null);
                        setNotice(null);
                      }}
                      type="button"
                    >
                      Report
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}
