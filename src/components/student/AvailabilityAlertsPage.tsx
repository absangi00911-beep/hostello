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
import { AccountPageHeader } from "@/components/layout/AccountPageHeader";

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
    <main id="main-content" className="min-h-dvh bg-canvas pt-8 pb-28 text-ink md:py-14">
      <div className="mx-auto w-[min(calc(100%-var(--page-gutter-mobile)),640px)] md:w-[min(1040px,calc(100%-var(--page-gutter-total)))]">
        <AccountPageHeader
          title="Availability alerts"
          description="We’ll let you know in Notifications when a hostel matches your dates and guest count."
          action={
            <Link
              className="inline-flex min-h-11 items-center rounded-[8px] border border-line bg-surface px-4 text-sm font-semibold text-ink no-underline hover:border-line-strong hover:bg-surface-muted"
              href="/notifications"
            >
              Notifications
            </Link>
          }
        />

      {notice && (
        <p aria-live="polite" className="mb-4 text-sm text-brand-dark" role="status">
          {notice}
        </p>
      )}
      {uncertain && (
        <button
          className="mb-4 inline-flex min-h-11 items-center rounded-[8px] border border-line bg-surface px-4 text-sm font-semibold"
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
          className="mb-5 inline-flex min-h-11 items-center justify-center rounded-[8px] bg-brand px-5 font-semibold text-white hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
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
      </div>
    </main>
  );
}
