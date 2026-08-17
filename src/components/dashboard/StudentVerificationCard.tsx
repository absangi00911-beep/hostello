"use client";

import { useState, useRef } from "react";
import { ShieldCheck, Upload, Clock, XCircle, Loader2 } from "lucide-react";
import { StudentBadge } from "@/components/ui/StudentBadge";

type Status = "NONE" | "PENDING" | "APPROVED" | "REJECTED";

interface Props {
  currentStatus: Status;
}

const STATUS_COPY = {
  NONE: {
    heading: "Get verified as a student",
    body:    "Upload your university ID or enrolment letter. Verified students are trusted more by owners and get priority responses.",
    icon:    ShieldCheck,
    iconBg:  "bg-[var(--color-primary-faint)]",
    iconColor: "text-[var(--color-primary)]",
  },
  PENDING: {
    heading: "Verification in review",
    body:    "We received your document and will review it within 24 hours. You'll get a notification once it's done.",
    icon:    Clock,
    iconBg:  "bg-[var(--color-warning-bg)]",
    iconColor: "text-[var(--color-warning)]",
  },
  APPROVED: {
    heading: "You're a verified student",
    body:    "Your university ID has been verified. Your profile shows the verified badge to hostel owners.",
    icon:    ShieldCheck,
    iconBg:  "bg-[var(--color-success-bg)]",
    iconColor: "text-[var(--color-success)]",
  },
  REJECTED: {
    heading: "Verification not approved",
    body:    "Your document couldn't be verified. Please upload a clearer image of your university ID or enrolment letter.",
    icon:    XCircle,
    iconBg:  "bg-[var(--color-error-bg)]",
    iconColor: "text-[var(--color-error)]",
  },
} satisfies Record<Status, unknown>;

export function StudentVerificationCard({ currentStatus }: Props) {
  const [status, setStatus]   = useState<Status>(currentStatus);
  const [uploading, setUploading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const fileRef               = useRef<HTMLInputElement>(null);

  const cfg  = STATUS_COPY[status];
  const Icon = cfg.icon;

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      // 1. Upload the doc via the existing upload route
      const form = new FormData();
      form.append("file", file);
      const upRes = await fetch("/api/upload", { method: "POST", body: form });
      if (!upRes.ok) throw new Error("Upload failed");
      const { url } = await upRes.json();

      // 2. Submit the URL for admin review
      const subRes = await fetch("/api/user/verify-student", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ docUrl: url }),
      });
      if (!subRes.ok) throw new Error("Submission failed");

      setStatus("PENDING");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const canUpload = status === "NONE" || status === "REJECTED";

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-5">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] ${cfg.iconBg}`}>
          <Icon size={20} strokeWidth={1.5} className={cfg.iconColor} aria-hidden="true" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="text-[var(--text-body-sm)] font-[600] text-[var(--color-text-heading)]">
              {cfg.heading}
            </p>
            {status === "APPROVED" && <StudentBadge />}
          </div>

          <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)] leading-relaxed mb-4">
            {cfg.body}
          </p>

          {error && (
            <p className="text-[var(--text-body-sm)] text-[var(--color-error-text)] mb-3" role="alert">
              {error}
            </p>
          )}

          {canUpload && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleFile}
                className="sr-only"
                id="verification-doc-upload"
                aria-label="Upload university ID or enrolment letter"
              />
              <label
                htmlFor="verification-doc-upload"
                className={`inline-flex items-center gap-2 h-9 px-4 rounded-[var(--radius-md)] cursor-pointer
                  text-[var(--text-body-sm)] font-[500] transition-colors
                  ${uploading
                    ? "bg-[var(--color-bg-sidebar)] text-[var(--color-text-muted)] pointer-events-none"
                    : "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-deep)]"}`}
              >
                {uploading
                  ? <><Loader2 size={14} strokeWidth={1.5} className="animate-spin" aria-hidden="true" /> Uploading…</>
                  : <><Upload  size={14} strokeWidth={1.5} aria-hidden="true" /> Upload ID / enrolment letter</>}
              </label>
              <p className="text-[var(--text-caption)] text-[var(--color-text-muted)] mt-2">
                JPG, PNG, WebP or PDF · max 5 MB · your document is kept private
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
