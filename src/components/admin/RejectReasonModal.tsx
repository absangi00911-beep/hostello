"use client";
// Path: src/components/admin/RejectReasonModal.tsx

import { useState, useRef } from "react";
import { X, Loader2 } from "lucide-react";
import { inputCls } from "@/components/ui/input";
import { useModalFocus } from "@/components/ui/use-modal-focus";
import { cn } from "@/lib/utils";

const QUICK_REASONS = [
  "Photos are missing or low quality",
  "Description does not meet minimum length",
  "Address or location details are incomplete",
  "Price seems inconsistent with listing details",
  "Listing contains prohibited content",
  "Duplicate of an existing listing",
];

interface RejectReasonModalProps {
  hostelName: string;
  action: "suspend" | "activate";
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function RejectReasonModal({
  hostelName,
  action,
  onConfirm,
  onCancel,
  loading = false,
}: RejectReasonModalProps) {
  const [reason, setReason] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const isSuspend = action === "suspend";
  const title     = isSuspend ? "Suspend listing" : "Reactivate listing";
  const subtitle  = isSuspend
    ? "Provide a reason. This will be sent to the owner by email."
    : "Reactivating will make this listing visible again.";

  useModalFocus({
    dialogRef,
    initialFocusRef: textareaRef,
    onEscape: () => { if (!loading) onCancel(); },
  });

  function handleConfirm() {
    const trimmed = reason.trim();
    if (isSuspend && !trimmed) return;
    onConfirm(trimmed);
  }

  const canSubmit = isSuspend ? reason.trim().length > 0 : true;

  return (
    <>
      {/* Backdrop — warm scrim */}
      <div
        className="fixed inset-0 z-[60] bg-[#191c1d]/60"
        onClick={() => { if (!loading) onCancel(); }}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="fixed left-1/2 top-1/2 z-[70] w-full max-w-[440px] -translate-x-1/2 -translate-y-1/2"
      >
        <div className="rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)] bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)]">

          {/* Header */}
          <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4 border-b border-[var(--color-border-subtle)]">
            <div>
              <h2
                id="modal-title"
                className="text-[length:var(--text-body)] font-[600] text-[color:var(--color-text-heading)]"
              >
                {title}
              </h2>
              <p className="text-[length:var(--text-caption)] text-[color:var(--color-text-muted)] mt-0.5">
                {hostelName}
              </p>
            </div>
            <button
              onClick={onCancel}
              disabled={loading}
              aria-label="Close"
              className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[color:var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-overlay)] hover:text-[color:var(--color-text-body)]"
            >
              <X size={16} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-4 space-y-4">
            <p className="text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)]">
              {subtitle}
            </p>

            {isSuspend && (
              <>
                {/* Quick reasons */}
                <div className="space-y-1.5">
                  <p className="text-[length:var(--text-label)] font-[500] text-[color:var(--color-text-body)]">
                    Quick reasons
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_REASONS.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => { setReason(r); textareaRef.current?.focus(); }}
                        className={cn(
                          "h-7 px-2.5 rounded-full border text-[length:var(--text-caption)] font-[500] transition-colors duration-[var(--transition-fast)]",
                          reason === r
                            ? "border-[var(--color-error)] bg-[var(--color-error-bg)] text-[color:var(--color-error)]"
                            : "border-[var(--color-border-default)] bg-[var(--color-bg-sidebar)] text-[color:var(--color-text-muted)] hover:border-[var(--color-border-strong)] hover:text-[color:var(--color-text-body)]"
                        )}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom reason */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="reason"
                    className="block text-[length:var(--text-label)] font-[500] text-[color:var(--color-text-body)]"
                  >
                    Reason <span className="text-[color:var(--color-error)]" aria-hidden="true">*</span>
                  </label>
                  <textarea
                    id="reason"
                    ref={textareaRef}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    placeholder="Explain why this listing is being suspended…"
                    className={cn(inputCls, "h-auto resize-none py-2.5")}
                    disabled={loading}
                  />
                  <p className="text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">
                    {reason.trim().length} chars · shown in the email to the owner
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-5 pb-5">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="h-9 px-4 rounded-[var(--radius-md)] border border-[var(--color-border-default)] text-[length:var(--text-body-sm)] font-[500] text-[color:var(--color-text-muted)] transition-colors duration-[var(--transition-fast)] hover:bg-[var(--color-bg-overlay)] hover:text-[color:var(--color-text-body)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!canSubmit || loading}
              className={cn(
                "inline-flex items-center gap-2 h-9 px-4 rounded-[var(--radius-md)] text-[length:var(--text-body-sm)] font-[600] text-[color:var(--color-text-inverse)] transition-colors duration-[var(--transition-base)] disabled:opacity-50",
                isSuspend
                  ? "bg-[var(--color-error)] hover:opacity-90"
                  : "bg-[var(--color-action)] hover:bg-[var(--color-action-dark)]"
              )}
            >
              {loading && (
                <Loader2 size={14} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />
              )}
              {isSuspend ? "Suspend listing" : "Reactivate listing"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
