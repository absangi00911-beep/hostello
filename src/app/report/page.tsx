// Path: src/app/report/page.tsx
"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { inputCls } from "@/components/auth/AuthCardLayout";

const REPORT_TYPES = [
  { value: "FAKE_LISTING",       label: "Fake or misleading listing" },
  { value: "SCAM",               label: "Scam or fraudulent activity" },
  { value: "INAPPROPRIATE",      label: "Inappropriate content or photos" },
  { value: "WRONG_INFORMATION",  label: "Incorrect price or information" },
  { value: "SAFETY_CONCERN",     label: "Safety concern" },
  { value: "OWNER_MISCONDUCT",   label: "Owner misconduct" },
  { value: "OTHER",              label: "Other" },
];

export default function ReportPage() {
  const [type,        setType]        = useState("");
  const [hostelUrl,   setHostelUrl]   = useState("");
  const [description, setDescription] = useState("");
  const [loading,     setLoading]     = useState(false);
  const [sent,        setSent]        = useState(false);
  const [error,       setError]       = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/report", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          type,
          hostelUrl: hostelUrl.trim() || undefined,
          description: description.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Couldn't submit report. Please try again.");
        return;
      }
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicLayout>
      <div className="mx-auto max-w-[560px] px-4 py-12 md:py-16">
        {/* Heading */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-warning-bg)]">
              <AlertTriangle
                size={18}
                strokeWidth={1.5}
                className="text-[var(--color-warning)]"
                aria-hidden="true"
              />
            </div>
            <h1
              className="text-[var(--text-h2)] font-[700] text-[var(--color-text-heading)] tracking-[-0.02em]"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Report an issue
            </h1>
          </div>
          <p className="text-[var(--text-body)] text-[var(--color-text-muted)] leading-relaxed">
            Help us keep HostelLo safe. We review all reports within 48 hours
            and take action on verified issues.
          </p>
        </div>

        {sent ? (
          <div className="rounded-[var(--radius-lg)] border border-[oklch(0.52_0.14_148_/_0.3)] bg-[var(--color-success-bg)] p-8 text-center space-y-3">
            <CheckCircle2
              size={40}
              strokeWidth={1.5}
              className="text-[var(--color-success)] mx-auto"
              aria-hidden="true"
            />
            <h2
              className="text-[var(--text-h4)] font-[600] text-[var(--color-text-heading)]"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Report submitted
            </h2>
            <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
              We review all reports within 48 hours. Thank you for helping keep
              HostelLo trustworthy.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div
                role="alert"
                className="rounded-[var(--radius-md)] bg-[var(--color-error-bg)] border border-[oklch(0.52_0.18_22_/_0.2)] px-4 py-3 text-[var(--text-body-sm)] text-[var(--color-error-text)]"
              >
                {error}
              </div>
            )}

            {/* Report type */}
            <div className="space-y-1.5">
              <label
                htmlFor="rp-type"
                className="block text-[var(--text-label)] font-[500] text-[var(--color-text-body)]"
              >
                What are you reporting?
              </label>
              <select
                id="rp-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
                className={`${inputCls} appearance-none`}
              >
                <option value="">Select issue type</option>
                {REPORT_TYPES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Hostel URL — optional */}
            <div className="space-y-1.5">
              <label
                htmlFor="rp-url"
                className="block text-[var(--text-label)] font-[500] text-[var(--color-text-body)]"
              >
                Hostel page URL{" "}
                <span className="text-[var(--color-text-muted)] font-[400]">(optional)</span>
              </label>
              <input
                id="rp-url"
                type="url"
                value={hostelUrl}
                onChange={(e) => setHostelUrl(e.target.value)}
                placeholder="https://hostello.pk/hostels/..."
                className={inputCls}
              />
              <p className="text-[var(--text-caption)] text-[var(--color-text-muted)]">
                Paste the link to the hostel page if applicable.
              </p>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label
                htmlFor="rp-desc"
                className="block text-[var(--text-label)] font-[500] text-[var(--color-text-body)]"
              >
                Description
              </label>
              <textarea
                id="rp-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                required
                minLength={30}
                placeholder="Describe what you experienced or observed. Be as specific as possible — include dates, names, or any evidence you have."
                className={`${inputCls} h-auto resize-none py-2.5`}
              />
              <p className="text-[var(--text-caption)] text-[var(--color-text-muted)]">
                {description.length} characters · minimum 30
              </p>
            </div>

            {/* Note on anonymous reporting */}
            <div className="rounded-[var(--radius-md)] bg-[var(--color-bg-sidebar)] border border-[var(--color-border-subtle)] px-4 py-3">
              <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
                Reports are reviewed by the HostelLo moderation team. Your
                identity is not shared with the reported party.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !type || description.length < 30}
              className="inline-flex w-full items-center justify-center gap-2 h-11 rounded-[var(--radius-md)] bg-[var(--color-action)] text-[var(--text-body-sm)] font-[500] text-white hover:bg-[var(--color-action-dark)] active:scale-[0.97] transition-all duration-[var(--transition-base)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && (
                <Loader2 size={16} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />
              )}
              {loading ? "Submitting…" : "Submit report"}
            </button>
          </form>
        )}
      </div>
    </PublicLayout>
  );
}
