"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, Loader2 } from "lucide-react";

export function DeleteAccountForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function handleDelete() {
    if (!password.trim()) {
      toast.error("Password is required");
      return;
    }

    if (!confirmed) {
      toast.error("Please confirm you understand the consequences");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Failed to delete account");
      }

      // Success! Sign out and redirect
      toast.success("Account deleted. Signing you out...");
      
      setTimeout(() => {
        // Sign out by redirecting to logout
        window.location.href = "/api/auth/signout?callbackUrl=/";
      }, 1500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  if (!showForm) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <h2
              className="text-base font-extrabold text-red-900 mb-2"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Danger zone: Delete account
            </h2>
            <p className="text-sm text-red-700 mb-4">
              This action is <strong>permanent and cannot be undone</strong>. Your account, all bookings, reviews, messages, and hosted listings will be permanently deleted.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="text-sm font-bold text-red-600 hover:text-red-700 underline"
            >
              Proceed to delete account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
      <div className="space-y-5">
        {/* Warning box */}
        <div className="bg-white rounded-xl p-4 border border-red-100">
          <p className="text-sm text-[var(--color-ink-soft)] mb-3 font-semibold">
            Before you go, here's what will happen:
          </p>
          <ul className="text-sm text-[var(--color-ink-soft)] space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-red-600 mt-0.5">•</span>
              <span>All your personal information will be permanently deleted</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-600 mt-0.5">•</span>
              <span>Booking history and messages will be removed</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-600 mt-0.5">•</span>
              <span>Reviews and ratings you've left will be deleted</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-600 mt-0.5">•</span>
              <span>Any hostels you manage will be removed</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-600 mt-0.5">•</span>
              <span>This complies with GDPR Article 17 (Right to be Forgotten) and Pakistan's PECA</span>
            </li>
          </ul>
        </div>

        {/* Password field */}
        <div>
          <label className="block text-sm font-semibold text-[var(--color-ink-soft)] mb-1.5">
            Enter your password to confirm
            <span className="text-red-500 ml-0.5">*</span>
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your current password"
            autoComplete="current-password"
            disabled={loading}
            className="w-full h-11 px-4 rounded-xl border border-[var(--color-border)] text-sm bg-[var(--color-surface)] text-[var(--color-ink)] placeholder:text-[var(--color-muted)] outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all disabled:opacity-50"
          />
        </div>

        {/* Confirmation checkbox */}
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="confirm"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            disabled={loading}
            className="mt-1 w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
          />
          <label htmlFor="confirm" className="text-sm text-[var(--color-ink-soft)] cursor-pointer">
            I understand that this action is <strong>permanent and irreversible</strong>, and I want to proceed with deleting my account and all associated data.
          </label>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => {
              setShowForm(false);
              setPassword("");
              setConfirmed(false);
            }}
            disabled={loading}
            className="flex-1 px-6 py-2.5 rounded-xl border border-[var(--color-border)] text-[var(--color-ink)] text-sm font-bold hover:bg-[var(--color-ground)] disabled:opacity-40 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading || !password.trim() || !confirmed}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {loading ? "Deleting…" : "Delete my account"}
          </button>
        </div>

        {/* Privacy link */}
        <p className="text-xs text-[var(--color-muted)] text-center">
          For more information, see our{" "}
          <a href="/privacy" className="text-[var(--color-brand-600)] hover:underline">
            privacy policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}
