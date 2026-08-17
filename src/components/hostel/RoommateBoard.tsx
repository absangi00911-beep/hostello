"use client";

import { useState } from "react";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import {
  Plus, Trash2, MessageCircle, Flag,
  Loader2, CalendarDays, Banknote,
} from "lucide-react";
import { StudentBadge } from "@/components/ui/StudentBadge";
import { formatPKR } from "@/components/ui/shared";

interface Post {
  id: string;
  bio: string;
  budget: number | null;
  moveIn: string | null;
  expiresAt: string;
  createdAt: string;
  userId: string;
  user: { id: string; name: string; avatar: string | null; city: string | null; studentVerified?: boolean };
  _count?: { reports: number };
}

interface Props {
  hostelId: string;
  hostelName: string;
  currentUserId: string | null;
}

const MAX_BIO = 200;

export function RoommateBoard({ hostelId, hostelName, currentUserId }: Props) {
  const qc = useQueryClient();
  const router = useRouter();

  const [showForm, setShowForm]   = useState(false);
  const [bio, setBio]             = useState("");
  const [budget, setBudget]       = useState("");
  const [moveIn, setMoveIn]       = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [reported, setReported]   = useState<Set<string>>(new Set());
  const [messaging, setMessaging] = useState<string | null>(null);
  const [expiringThreshold] = useState(() => {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + 3);
    return threshold;
  });

  const { data, isLoading } = useQuery<{ data: Post[] }>({
    queryKey: ["roommates", hostelId],
    queryFn: () => fetch(`/api/hostels/${hostelId}/roommates`).then((r) => r.json()),
  });

  const posts = data?.data ?? [];
  const myPost = posts.find((p) => p.userId === currentUserId);

  const postMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/hostels/${hostelId}/roommates`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          bio,
          budget: budget ? parseInt(budget, 10) : undefined,
          moveIn: moveIn || undefined,
        }),
      }).then((r) => r.json()),
    onSuccess: (json) => {
      if (json.error) { setFormError(json.error); return; }
      qc.invalidateQueries({ queryKey: ["roommates", hostelId] });
      setShowForm(false);
      setBio(""); setBudget(""); setMoveIn("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/roommates/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roommates", hostelId] }),
  });

  async function handleMessage(post: Post) {
    if (!currentUserId) { router.push("/login"); return; }
    setMessaging(post.id);
    try {
      const res = await fetch("/api/conversations", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          hostelId,
          initialMessage: `Hi ${post.user.name.split(" ")[0]}, I saw your roommate post for ${hostelName} on HostelLo — I'm also looking for a roommate there!`,
        }),
      });
      const json = await res.json();
      if (json.data?.conversation?.id) {
        router.push(`/dashboard/messages?conversation=${json.data.conversation.id}`);
      }
    } finally {
      setMessaging(null);
    }
  }

  async function handleReport(postId: string) {
    await fetch(`/api/roommates/${postId}/report`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ reason: "Inappropriate content" }),
    });
    setReported((prev) => new Set([...prev, postId]));
  }

  const tomorrow = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  })();

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
            {posts.length > 0
              ? `${posts.length} student${posts.length !== 1 ? "s" : ""} looking for a roommate`
              : "No posts yet — be the first to post."}
          </p>
        </div>
        {currentUserId && !showForm && (
          <button
            onClick={() => { setShowForm(true); if (myPost) { setBio(myPost.bio); setBudget(myPost.budget?.toString() ?? ""); } }}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] text-[var(--text-body-sm)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary-deep)] transition-colors"
          >
            <Plus size={13} strokeWidth={2} aria-hidden="true" />
            {myPost ? "Edit my post" : "I'm looking for a roommate"}
          </button>
        )}
      </div>

      {/* Post form */}
      {showForm && currentUserId && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-primary)] bg-[var(--color-primary-faint)] p-4 space-y-3">
          <p className="text-[var(--text-body-sm)] font-[600] text-[var(--color-primary-deep)]">
            {myPost ? "Update your post" : "Post a roommate request"}
          </p>

          <div>
            <label htmlFor="rm-bio" className="block text-[var(--text-label)] font-[500] text-[var(--color-text-body)] mb-1.5">
              About you <span className="font-[400] text-[var(--color-text-muted)]">({bio.length}/{MAX_BIO})</span>
            </label>
            <textarea
              id="rm-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, MAX_BIO))}
              rows={3}
              placeholder="e.g. Final year CS student at NUST, clean and quiet. Looking for a roommate to split a double room."
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] px-3 py-2 text-[var(--text-body-sm)] text-[var(--color-text-body)] focus:outline-none focus:border-[var(--color-primary)] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="rm-budget" className="block text-[var(--text-label)] font-[500] text-[var(--color-text-body)] mb-1.5">
                Max budget/mo <span className="font-[400] text-[var(--color-text-muted)]">(optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-body-sm)] text-[var(--color-text-muted)]">PKR</span>
                <input
                  id="rm-budget"
                  type="number"
                  min={0}
                  step={500}
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="15000"
                  className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] pl-12 pr-3 text-[var(--text-body-sm)] focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>
            </div>
            <div>
              <label htmlFor="rm-movein" className="block text-[var(--text-label)] font-[500] text-[var(--color-text-body)] mb-1.5">
                Move-in date <span className="font-[400] text-[var(--color-text-muted)]">(optional)</span>
              </label>
              <input
                id="rm-movein"
                type="date"
                value={moveIn}
                min={tomorrow}
                onChange={(e) => setMoveIn(e.target.value)}
                className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] px-3 text-[var(--text-body-sm)] focus:outline-none focus:border-[var(--color-primary)]"
              />
            </div>
          </div>

          {formError && (
            <p className="text-[var(--text-body-sm)] text-[var(--color-error-text)]" role="alert">{formError}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => postMutation.mutate()}
              disabled={postMutation.isPending || !bio.trim()}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white text-[var(--text-body-sm)] font-[500] hover:bg-[var(--color-primary-deep)] disabled:opacity-40 transition-colors"
            >
              {postMutation.isPending
                ? <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                : null}
              {myPost ? "Update post" : "Post"}
            </button>
            <button
              onClick={() => { setShowForm(false); setFormError(null); }}
              className="h-9 px-4 rounded-[var(--radius-md)] border border-[var(--color-border-default)] text-[var(--text-body-sm)] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Sign-in prompt */}
      {!currentUserId && (
        <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-default)] px-4 py-3 text-center">
          <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
            <button
              onClick={() => router.push("/login")}
              className="font-[500] text-[var(--color-primary)] hover:underline"
            >
              Sign in
            </button>
            {" "}to post a roommate request or message other students.
          </p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center gap-2 py-4 text-[var(--color-text-muted)]">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-[var(--text-body-sm)]">Loading posts…</span>
        </div>
      )}

      {/* Posts list */}
      {!isLoading && posts.length > 0 && (
        <div className="space-y-3" role="list">
          {posts.map((post) => {
            const isOwn      = post.userId === currentUserId;
            const isReported = reported.has(post.id);
            const expiresIn  = formatDistanceToNow(new Date(post.expiresAt), { addSuffix: true });
            const isExpiring = new Date(post.expiresAt) < expiringThreshold;

            return (
              <div
                key={post.id}
                role="listitem"
                className={`rounded-[var(--radius-lg)] border bg-[var(--color-bg-card)] p-4
                  ${isOwn ? "border-[var(--color-primary-light)]" : "border-[var(--color-border-subtle)]"}`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-faint)] text-[var(--color-primary-deep)] font-[600] text-[13px]" aria-hidden="true">
                    {post.user.avatar
                      ? (
                          <Image
                            src={post.user.avatar}
                            alt=""
                            width={36}
                            height={36}
                            className="h-9 w-9 rounded-full object-cover"
                          />
                        )
                      : post.user.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Name row */}
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-[var(--text-body-sm)] font-[600] text-[var(--color-text-heading)]">
                        {post.user.name}
                      </span>
                      {isOwn && (
                        <span className="inline-flex h-5 items-center rounded-full bg-[var(--color-primary-faint)] px-2 text-[11px] font-[500] text-[var(--color-primary-deep)]">
                          You
                        </span>
                      )}
                      {post.user.studentVerified && <StudentBadge />}
                      {post.user.city && (
                        <span className="text-[var(--text-caption)] text-[var(--color-text-muted)]">
                          · {post.user.city}
                        </span>
                      )}
                    </div>

                    {/* Bio */}
                    <p className="text-[var(--text-body-sm)] text-[var(--color-text-body)] leading-relaxed mb-2">
                      {post.bio}
                    </p>

                    {/* Meta chips */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {post.budget && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-[var(--color-text-muted)]">
                          <Banknote size={11} strokeWidth={1.5} aria-hidden="true" />
                          Up to {formatPKR(post.budget)}/mo
                        </span>
                      )}
                      {post.moveIn && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-[var(--color-text-muted)]">
                          <CalendarDays size={11} strokeWidth={1.5} aria-hidden="true" />
                          Move-in {format(new Date(post.moveIn), "d MMM yyyy")}
                        </span>
                      )}
                      <span className={`text-[11px] ${isExpiring ? "text-[var(--color-warning)]" : "text-[var(--color-text-muted)]"}`}>
                        Expires {expiresIn}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {isOwn ? (
                        <button
                          onClick={() => deleteMutation.mutate(post.id)}
                          disabled={deleteMutation.isPending}
                          aria-label="Delete your roommate post"
                          className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[var(--radius-sm)] border border-[var(--color-border-default)] text-[11px] text-[var(--color-text-muted)] hover:border-[var(--color-error)] hover:text-[var(--color-error)] transition-colors disabled:opacity-40"
                        >
                          <Trash2 size={11} strokeWidth={1.5} aria-hidden="true" />
                          Delete
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleMessage(post)}
                            disabled={messaging === post.id || !currentUserId}
                            className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[var(--radius-sm)] bg-[var(--color-primary)] text-white text-[11px] font-[500] hover:bg-[var(--color-primary-deep)] disabled:opacity-40 transition-colors"
                          >
                            {messaging === post.id
                              ? <Loader2 size={11} className="animate-spin" aria-hidden="true" />
                              : <MessageCircle size={11} strokeWidth={1.5} aria-hidden="true" />}
                            Message
                          </button>
                          {!isReported && (
                            <button
                              onClick={() => handleReport(post.id)}
                              aria-label="Report this post"
                              className="inline-flex items-center gap-1 h-7 px-2 rounded-[var(--radius-sm)] text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors"
                            >
                              <Flag size={10} strokeWidth={1.5} aria-hidden="true" />
                              Report
                            </button>
                          )}
                          {isReported && (
                            <span className="text-[11px] text-[var(--color-text-muted)]">Reported</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
