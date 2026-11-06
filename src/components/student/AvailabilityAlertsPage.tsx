"use client";

import Link from "next/link";
import { useState } from "react";
import { AvailabilityAlertForm } from "@/components/student/AvailabilityAlertForm";
import { AvailabilityAlertList } from "@/components/student/AvailabilityAlertList";
import {
  AvailabilityAlertsEmpty,
  AvailabilityAlertsError,
  AvailabilityAlertsLoading,
} from "@/components/student/AvailabilityAlertStates";
import {
  toAvailabilityAlertFormInitial,
} from "@/components/student/AvailabilityAlertCard";
import type { AlertRecord } from "@/components/student/availability-alert-types";
import type { AvailabilityAlertFormInitial } from "@/components/student/availability-alert-form-model";
import { useAvailabilityAlerts } from "@/components/student/use-availability-alerts";

export function AvailabilityAlertsPage({
  initial,
}: {
  initial?: AvailabilityAlertFormInitial;
}) {
  const {
    alerts,
    hasMore,
    total,
    loading,
    loadError,
    setPage,
    pending,
    uncertain,
    refreshingUncertain,
    notice,
    setNotice,
    refreshList,
    refreshUncertain,
    markUncertain,
    updateActive,
    deleteAlert,
  } = useAvailabilityAlerts();
  const [createInitial, setCreateInitial] = useState(initial);
  const [showCreateForm, setShowCreateForm] = useState(Boolean(initial));
  const [editing, setEditing] = useState<AlertRecord | null>(null);

  function onFormSaved(result: { isMatched: boolean }) {
    setNotice(
      result.isMatched
        ? "Availability matches your alert. You’ll find a notification in Notifications."
        : editing
          ? "Alert updated."
          : "Alert created.",
    );
    setEditing(null);
    setCreateInitial(undefined);
    setShowCreateForm(false);
    refreshList();
  }

  function onFormUncertain() {
    setEditing(null);
    setCreateInitial(undefined);
    setShowCreateForm(false);
    markUncertain();
  }

  function createNewFromExpired(alert: AlertRecord) {
    const formInitial = toAvailabilityAlertFormInitial(alert);
    setCreateInitial(
      formInitial.type === "HOSTEL"
        ? {
            type: "HOSTEL",
            hostelId: formInitial.hostelId,
            guests: formInitial.guests,
          }
        : {
            type: "SEARCH",
            criteria: formInitial.criteria,
            guests: formInitial.guests,
          },
    );
    setShowCreateForm(true);
    setEditing(null);
  }

  return (
    <main className="mx-auto w-[min(100%-32px,880px)] pb-28 pt-8 text-ink sm:w-[min(100%-48px,880px)] sm:pt-12">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="m-0 text-xs font-bold uppercase tracking-[0.1em] text-brand">
            Student account
          </p>
          <h1 className="mt-1 mb-2 text-[clamp(1.7rem,4vw,2.2rem)] font-semibold tracking-[-0.035em]">
            Availability alerts
          </h1>
          <p className="m-0 max-w-[52ch] text-sm leading-6 text-muted">
            We’ll let you know in Notifications when a hostel matches your dates and guest count.
          </p>
        </div>
        <Link
          className="inline-flex min-h-11 items-center rounded-lg border border-line px-4 text-sm font-semibold text-ink hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
          href="/notifications"
        >
          Notifications
        </Link>
      </header>

      {notice && (
        <p aria-live="polite" className="mb-4 text-sm text-brand-dark" role="status">
          {notice}
        </p>
      )}
      {uncertain && (
        <button
          className="mb-4 inline-flex min-h-11 items-center rounded-lg border border-line bg-white px-4 text-sm font-semibold"
          disabled={refreshingUncertain}
          onClick={refreshUncertain}
          type="button"
        >
          {refreshingUncertain ? "Refreshing…" : "Refresh alerts"}
        </button>
      )}

      {createInitial && showCreateForm && (
        <AvailabilityAlertForm
          initial={createInitial}
          onCancel={() => {
            setCreateInitial(undefined);
            setShowCreateForm(false);
          }}
          onSaved={onFormSaved}
          onUncertain={onFormUncertain}
        />
      )}
      {editing && (
        <div className="mb-5">
          <AvailabilityAlertForm
            initial={toAvailabilityAlertFormInitial(editing)}
            onCancel={() => setEditing(null)}
            onSaved={onFormSaved}
            onUncertain={onFormUncertain}
          />
        </div>
      )}
      {!createInitial && !editing && showCreateForm && (
        <div className="mb-5">
          <AvailabilityAlertForm
            onCancel={() => setShowCreateForm(false)}
            onSaved={onFormSaved}
            onUncertain={onFormUncertain}
          />
        </div>
      )}

      {!showCreateForm && !editing && alerts.length > 0 && (
        <button
          className="mb-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-brand px-5 font-semibold text-white hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
          onClick={() => setShowCreateForm(true)}
          type="button"
        >
          Create alert
        </button>
      )}

      {loading && <AvailabilityAlertsLoading />}
      {!loading && loadError && (
        <AvailabilityAlertsError message={loadError} onRetry={refreshList} />
      )}
      {!loading && !loadError && alerts.length === 0 && !showCreateForm && !editing && (
        <AvailabilityAlertsEmpty onCreate={() => setShowCreateForm(true)} />
      )}
      {!loading && !loadError && alerts.length > 0 && (
        <>
          <p className="mb-3 text-sm text-muted" role="status">
            {total} {total === 1 ? "alert" : "alerts"}
          </p>
          <AvailabilityAlertList
            alerts={alerts}
            hasMore={hasMore}
            onCreateNew={createNewFromExpired}
            onDelete={(alert) => void deleteAlert(alert)}
            onEdit={(alert) => {
              setEditing(alert);
              setShowCreateForm(false);
            }}
            onLoadMore={() => setPage((current) => current + 1)}
            onToggle={(alert) =>
              void updateActive(alert, alert.status !== "ACTIVE")
            }
            pending={pending}
          />
        </>
      )}
    </main>
  );
}
