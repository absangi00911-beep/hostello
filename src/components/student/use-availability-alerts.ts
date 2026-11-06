"use client";

import { useEffect, useRef, useState } from "react";
import { describeAvailabilityAlert } from "@/components/student/AvailabilityAlertCard";
import type { AlertRecord } from "@/components/student/availability-alert-types";

type AlertListResponse = {
  data: AlertRecord[];
  total: number;
  hasMore: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAlertRecord(value: unknown): value is AlertRecord {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    (value.type === "HOSTEL" || value.type === "SEARCH") &&
    (value.hostelName === undefined ||
      value.hostelName === null ||
      typeof value.hostelName === "string") &&
    isRecord(value.criteria) &&
    typeof value.checkIn === "string" &&
    typeof value.checkOut === "string" &&
    typeof value.guests === "number" &&
    (value.status === "ACTIVE" ||
      value.status === "PAUSED" ||
      value.status === "EXPIRED") &&
    typeof value.isMatched === "boolean"
  );
}

function parseListResponse(value: unknown): AlertListResponse | null {
  if (
    !isRecord(value) ||
    !Array.isArray(value.data) ||
    !value.data.every(isAlertRecord) ||
    typeof value.total !== "number" ||
    typeof value.hasMore !== "boolean"
  ) {
    return null;
  }
  return value as AlertListResponse;
}

export function useAvailabilityAlerts() {
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);
  const [pending, setPending] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [refreshingUncertain, setRefreshingUncertain] = useState(false);
  const refreshingUncertainRef = useRef(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function loadAlerts() {
      setLoading(true);
      setLoadError("");
      try {
        const response = await fetch(
          `/api/availability-alerts?page=${page}&limit=20`,
          { signal: controller.signal },
        );
        const result: unknown = await response.json();
        if (!response.ok) {
          setLoadError(
            isRecord(result) && typeof result.error === "string"
              ? result.error
              : "Unable to load your availability alerts.",
          );
          return;
        }
        const parsed = parseListResponse(result);
        if (!parsed) {
          setLoadError("Unable to load your availability alerts.");
          return;
        }
        setAlerts((current) =>
          page > 1 ? [...current, ...parsed.data] : parsed.data,
        );
        setTotal(parsed.total);
        setHasMore(parsed.hasMore);
        if (refreshingUncertainRef.current) {
          setUncertain(false);
          setRefreshingUncertain(false);
          refreshingUncertainRef.current = false;
          setNotice("Alert list refreshed.");
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        setLoadError("Unable to load your availability alerts.");
      } finally {
        if (refreshingUncertainRef.current) {
          setRefreshingUncertain(false);
          refreshingUncertainRef.current = false;
        }
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadAlerts();
    return () => controller.abort();
  }, [page, reloadToken]);

  function refreshList() {
    setPage(1);
    setReloadToken((current) => current + 1);
  }

  function refreshUncertain() {
    refreshingUncertainRef.current = true;
    setRefreshingUncertain(true);
    refreshList();
  }

  async function updateActive(alert: AlertRecord, active: boolean) {
    setPending(true);
    setNotice("");
    try {
      const response = await fetch(
        `/api/availability-alerts/${encodeURIComponent(alert.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active }),
        },
      );
      if (!response.ok) {
        setUncertain(true);
        setNotice("We couldn't confirm this change. Refresh the alert list before trying again.");
        return;
      }
      setNotice(active ? "Alert resumed." : "Alert paused.");
      refreshList();
    } catch {
      setUncertain(true);
      setNotice("We couldn't confirm this change. Refresh the alert list before trying again.");
    } finally {
      setPending(false);
    }
  }

  async function deleteAlert(alert: AlertRecord) {
    if (!window.confirm(`Delete this alert: ${describeAvailabilityAlert(alert)}?`)) return;
    setPending(true);
    setNotice("");
    try {
      const response = await fetch(
        `/api/availability-alerts/${encodeURIComponent(alert.id)}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        setUncertain(true);
        setNotice("We couldn't confirm deletion. Refresh the alert list before trying again.");
        return;
      }
      setNotice("Alert deleted.");
      refreshList();
    } catch {
      setUncertain(true);
      setNotice("We couldn't confirm deletion. Refresh the alert list before trying again.");
    } finally {
      setPending(false);
    }
  }

  function markUncertain() {
    setUncertain(true);
    setNotice("We couldn't confirm whether this change was saved. Refresh the alert list before trying again.");
    refreshUncertain();
  }

  return {
    alerts,
    hasMore,
    total,
    loading,
    loadError,
    page,
    setPage,
    pending: pending || uncertain || refreshingUncertain,
    uncertain,
    refreshingUncertain,
    notice,
    setNotice,
    refreshList,
    refreshUncertain,
    markUncertain,
    updateActive,
    deleteAlert,
  };
}
