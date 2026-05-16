// Path: src/app/contact/page.tsx
"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { inputCls } from "@/components/auth/AuthCardLayout";

const SUBJECTS = [
  "General enquiry",
  "Booking help",
  "Listing issue",
  "Payment problem",
  "Report a hostel",
  "Other",
];

export default function ContactPage() {
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res  = await fetch("/api/contact", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: name.trim(), email: email.trim(), subject, message: message.trim() }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Couldn't send message. Please try again."); return; }
      setSent(true);
    } catch { setError("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  }

  return (
    <PublicLayout>
      <div className="mx-auto max-w-[560px] px-4 py-12 md:py-16">
        <div className="mb-8">
          <h1
            className="text-[var(--text-h2)] font-[700] text-[var(--color-text-heading)] tracking-[-0.02em]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Contact us
          </h1>
          <p className="text-[var(--text-body)] text-[var(--color-text-muted)] mt-2">
            We reply to all messages within 24 hours.
          </p>
        </div>

        {sent ? (
          <div className="rounded-[var(--radius-lg)] border border-[oklch(0.52_0.14_148_/_0.3)] bg-[var(--color-success-bg)] p-8 text-center space-y-3">
            <CheckCircle2 size={40} strokeWidth={1.5} className="text-[var(--color-success)] mx-auto" aria-hidden="true" />
            <h2 className="text-[var(--text-h4)] font-[600] text-[var(--color-text-heading)]" style={{ fontFamily: "var(--font-body)" }}>
              Message sent
            </h2>
            <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
              We'll reply to <strong>{email}</strong> within 24 hours.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div role="alert" className="rounded-[var(--radius-md)] bg-[var(--color-error-bg)] border border-[oklch(0.52_0.18_22_/_0.2)] px-4 py-3 text-[var(--text-body-sm)] text-[var(--color-error-text)]">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="ct-name" className="block text-[var(--text-label)] font-[500] text-[var(--color-text-body)]">Name</label>
                <input id="ct-name" type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Your name" required autoComplete="name" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="ct-email" className="block text-[var(--text-label)] font-[500] text-[var(--color-text-body)]">Email</label>
                <input id="ct-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com" required autoComplete="email" className={inputCls} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="ct-subject" className="block text-[var(--text-label)] font-[500] text-[var(--color-text-body)]">Subject</label>
              <select id="ct-subject" value={subject} onChange={(e) => setSubject(e.target.value)}
                required className={`${inputCls} appearance-none`}>
                <option value="">Select a topic</option>
                {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="ct-msg" className="block text-[var(--text-label)] font-[500] text-[var(--color-text-body)]">Message</label>
              <textarea id="ct-msg" value={message} onChange={(e) => setMessage(e.target.value)}
                rows={5} required minLength={20} placeholder="Describe your issue or question in detail."
                className={`${inputCls} h-auto resize-none py-2.5`} />
            </div>

            <button type="submit" disabled={loading || !name || !email || !subject || message.length < 20}
              className="inline-flex w-full items-center justify-center gap-2 h-11 rounded-[var(--radius-md)] bg-[var(--color-action)] text-[var(--text-body-sm)] font-[500] text-white hover:bg-[var(--color-action-dark)] active:scale-[0.97] transition-all duration-[var(--transition-base)] disabled:opacity-50 disabled:cursor-not-allowed">
              {loading && <Loader2 size={16} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />}
              {loading ? "Sending…" : "Send message"}
            </button>
          </form>
        )}
      </div>
    </PublicLayout>
  );
}
