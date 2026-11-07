"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Field,
  FormSection,
  controlProps,
  fieldClassName,
  secondaryButtonClassName,
} from "@/components/owner/ListingFormFields";
import { AdminUncertainActionNotice } from "./AdminUncertainActionNotice";
import {
  HOSTEL_ID_MAX,
  interpretSyncResponse,
  validateHostelId,
  type SearchSyncAction,
  type SearchSyncResult,
} from "./adminSearchSync";

const dangerButtonClassName =
  "inline-flex min-h-11 cursor-pointer items-center justify-center rounded-[8px] border-0 bg-danger px-4 text-[0.85rem] font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25),inset_0_-2px_0_rgb(0_0_0/0.18),0_2px_3px_rgb(15_23_42/0.22)] transition-[background-color,box-shadow,translate] duration-150 hover:bg-[#a52c10] active:translate-y-px active:bg-[#8f240d] active:shadow-[inset_0_3px_6px_rgb(0_0_0/0.3)] disabled:cursor-wait disabled:opacity-60 disabled:shadow-none disabled:active:translate-y-0 motion-reduce:transition-none motion-reduce:active:translate-y-0 focus-visible:outline-2! focus-visible:outline-brand!";

export type RunSyncAction = (
  action: SearchSyncAction,
  hostelId?: string,
) => Promise<SearchSyncResult>;

export async function runSearchSync(
  action: SearchSyncAction,
  hostelId?: string,
): Promise<SearchSyncResult> {
  try {
    const response = await fetch("/api/admin/search/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(hostelId ? { action, hostelId } : { action }),
    });
    const payload: unknown = await response.json().catch(() => null);
    return interpretSyncResponse(
      response.status,
      payload,
      response.headers.get("Retry-After"),
    );
  } catch {
    return {
      ok: false,
      message: "Could not reach the server.",
      uncertain: true,
    };
  }
}

function ResultNotice({ result }: { result: SearchSyncResult | null }) {
  if (!result) return null;
  return (
    <div className="grid gap-3">
      <p
        className={`m-0 rounded-[14px] px-[13px] py-[11px] text-[0.875rem] ${result.ok ? "bg-brand-soft text-brand-dark" : "bg-surface-muted text-danger"}`}
        role={result.ok ? "status" : "alert"}
      >
        {result.message}
      </p>
      {result.uncertain ? <AdminUncertainActionNotice /> : null}
    </div>
  );
}

export function SyncAllCard({ onRun }: { onRun: RunSyncAction }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SearchSyncResult | null>(null);

  async function run() {
    setBusy(true);
    setResult(null);
    const outcome = await onRun("sync-all");
    setBusy(false);
    setConfirming(false);
    setResult(outcome);
  }

  return (
    <FormSection
      description="Re-indexes every live listing from the database. Use it after a data migration or if search results look out of date."
      title="Sync all listings"
    >
      <p className="m-0 text-[0.85rem] text-muted">
        You can run this twice an hour. It can take a while, so keep this page
        open until it finishes.
      </p>
      {confirming ? (
        <div className="grid gap-3 rounded-[12px] bg-surface-muted p-4">
          <p className="m-0 text-[0.9rem] text-ink">
            Re-index all live listings now? This uses one of your two runs this
            hour.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              className={dangerButtonClassName}
              disabled={busy}
              onClick={() => void run()}
              type="button"
            >
              {busy ? "Syncing…" : "Yes, sync all"}
            </button>
            <button
              className={secondaryButtonClassName}
              disabled={busy}
              onClick={() => setConfirming(false)}
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : result?.uncertain ? null : (
        <div>
          <button
            className={secondaryButtonClassName}
            onClick={() => {
              setResult(null);
              setConfirming(true);
            }}
            type="button"
          >
            Sync all listings
          </button>
        </div>
      )}
      <ResultNotice result={result} />
    </FormSection>
  );
}

export function SingleHostelCard({ onRun }: { onRun: RunSyncAction }) {
  const [hostelId, setHostelId] = useState("");
  const [touched, setTouched] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SearchSyncResult | null>(null);
  const idError = touched ? validateHostelId(hostelId) : null;
  const hint =
    "The listing's database ID, not its name or URL. The admin screens do not show it yet.";

  async function run(action: "sync-single" | "remove") {
    setTouched(true);
    if (validateHostelId(hostelId)) return;
    setBusy(true);
    setResult(null);
    const outcome = await onRun(action, hostelId.trim());
    setBusy(false);
    setConfirmRemove(false);
    setResult(outcome);
  }

  return (
    <FormSection
      description="Fix one listing without re-indexing everything."
      title="One listing"
    >
      <Field error={idError ?? undefined} hint={hint} id="search-sync-hostel-id" label="Hostel ID">
        <input
          {...controlProps("search-sync-hostel-id", idError ?? undefined, hint)}
          autoComplete="off"
          className={fieldClassName}
          maxLength={HOSTEL_ID_MAX}
          onChange={(event) => {
            setHostelId(event.target.value);
            setConfirmRemove(false);
          }}
          type="text"
          value={hostelId}
        />
      </Field>
      <p className="m-0 text-[0.85rem] text-muted">
        You can run these 60 times an hour. A success message only means the
        request finished. If no listing has that ID, nothing is indexed and the
        page cannot tell you.
      </p>
      {confirmRemove ? (
        <div className="grid gap-3 rounded-[12px] bg-surface-muted p-4">
          <p className="m-0 text-[0.9rem] text-ink">
            Remove this listing from search? Students will stop finding it
            until it is synced again. The listing itself is not changed.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              className={dangerButtonClassName}
              disabled={busy || result?.uncertain === true}
              onClick={() => void run("remove")}
              type="button"
            >
              {busy ? "Removing…" : "Yes, remove from search"}
            </button>
            <button
              className={secondaryButtonClassName}
              disabled={busy}
              onClick={() => setConfirmRemove(false)}
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : result?.uncertain ? null : (
        <div className="flex flex-wrap gap-2">
          <button
            className={secondaryButtonClassName}
            disabled={busy || result?.uncertain === true}
            onClick={() => void run("sync-single")}
            type="button"
          >
            {busy ? "Syncing…" : "Sync this listing"}
          </button>
          <button
            className={secondaryButtonClassName}
            disabled={busy || result?.uncertain === true}
            onClick={() => {
              setTouched(true);
              setResult(null);
              if (!validateHostelId(hostelId)) setConfirmRemove(true);
            }}
            type="button"
          >
            Remove from search
          </button>
        </div>
      )}
      <ResultNotice result={result} />
    </FormSection>
  );
}

export function AdminSearchSyncContent({ onRun }: { onRun: RunSyncAction }) {
  return (
    <main className="mx-auto w-[min(760px,calc(100%-var(--page-gutter-mobile)))] pb-16 pt-8 md:pt-10">
      <Link
        className="text-[0.85rem] font-semibold text-brand hover:underline"
        href="/admin"
      >
        ← Back to admin console
      </Link>
      <h1 className="mb-0 mt-3 text-[clamp(1.6rem,3vw,2.1rem)] font-semibold tracking-[-0.035em] text-ink">
        Search index
      </h1>
      <p className="mb-6 mt-2 text-[0.95rem] text-muted">
        Keep the search index in line with the database. These actions only
        change search. They never change a listing, its status or its bookings.
        The server replies with a short message only, so this page cannot show
        counts or the index state.
      </p>
      <div className="grid gap-5">
        <SyncAllCard onRun={onRun} />
        <SingleHostelCard onRun={onRun} />
      </div>
    </main>
  );
}

export function AdminSearchSyncPage() {
  return <AdminSearchSyncContent onRun={runSearchSync} />;
}
