"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PLANS } from "@/config/plans";
import {
  FormSection,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "./ListingFormFields";
import {
  SUBSCRIPTION_STATUS_LABELS,
  parseCheckoutUrl,
  parseSubscription,
  readSubscriptionError,
  type OwnerSubscription,
  type SubscriptionReturnState,
} from "./ownerSubscription";

const currencyFormatter = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-PK", {
  dateStyle: "medium",
  timeZone: "Asia/Karachi",
});

function PlanCard({
  current,
  perks,
  planKey,
}: {
  current: boolean;
  perks: readonly string[];
  planKey: "FREE" | "PRO";
}) {
  const plan = PLANS[planKey];
  return (
    <div
      className={`grid content-start gap-3 rounded-[16px] border p-5 ${current ? "border-brand bg-brand-soft" : "border-line bg-surface"}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="m-0 text-[1.05rem] font-semibold text-ink">
          {plan.label}
        </h3>
        {current ? (
          <span className="rounded-full bg-brand px-[10px] py-[2px] text-[0.72rem] font-bold text-white">
            Current plan
          </span>
        ) : null}
      </div>
      <p className="m-0 text-[1.5rem] font-bold tracking-[-0.03em] text-ink">
        {plan.price === 0 ? "Free" : currencyFormatter.format(plan.price)}
        {plan.price > 0 ? (
          <span className="text-[0.85rem] font-medium text-muted"> / month</span>
        ) : null}
      </p>
      <ul className="m-0 grid list-disc gap-1 pl-5 text-[0.9rem] text-ink">
        {perks.map((perk) => (
          <li key={perk}>{perk}</li>
        ))}
      </ul>
    </div>
  );
}

export interface OwnerSubscriptionContentProps {
  isLoading: boolean;
  loadError: string | null;
  data: OwnerSubscription | null;
  returnState: SubscriptionReturnState;
  isUpgrading: boolean;
  upgradeError: string | null;
  onRetry: () => void;
  onUpgrade: () => void;
}

export function OwnerSubscriptionContent({
  isLoading,
  loadError,
  data,
  returnState,
  isUpgrading,
  upgradeError,
  onRetry,
  onUpgrade,
}: OwnerSubscriptionContentProps) {
  const isPro = data?.plan === "PRO";
  const limit = PLANS.FREE.maxListings;

  return (
    <main className="mx-auto w-[min(760px,calc(100%-var(--page-gutter-mobile)))] pb-16 pt-8 md:pt-10">
      <Link
        className="text-[0.85rem] font-semibold text-brand hover:underline"
        href="/owner"
      >
        ← Back to dashboard
      </Link>
      <h1 className="mb-0 mt-3 text-[clamp(1.6rem,3vw,2.1rem)] font-semibold tracking-[-0.035em] text-ink">
        Subscription
      </h1>
      <p className="mb-6 mt-2 text-[0.95rem] text-muted">
        Choose the plan that fits how many listings you run.
      </p>

      {isLoading ? (
        <p className="text-muted" role="status">
          Loading subscription...
        </p>
      ) : loadError || !data ? (
        <div className="rounded-[14px] bg-surface-muted p-4" role="alert">
          <p className="m-0 text-danger">
            {loadError ?? "Could not load your subscription."}
          </p>
          <button
            className={`${secondaryButtonClassName} mt-3`}
            onClick={onRetry}
            type="button"
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="grid gap-5">
          {returnState === "upgraded" && !isPro ? (
            <p
              className="m-0 rounded-[14px] bg-warn-soft px-[13px] py-[11px] text-[0.875rem] text-warn-ink"
              role="status"
            >
              Thanks. We&apos;re waiting for the payment confirmation. Pro
              switches on as soon as it arrives, usually within a minute.{" "}
              <button
                className="cursor-pointer border-0 bg-transparent p-0 font-semibold text-warn-ink underline"
                onClick={onRetry}
                type="button"
              >
                Check again
              </button>
            </p>
          ) : null}
          {returnState === "upgraded" && isPro ? (
            <p
              className="m-0 rounded-[14px] bg-brand-soft px-[13px] py-[11px] text-[0.875rem] text-brand-dark"
              role="status"
            >
              Payment received. Your Pro plan is active.
            </p>
          ) : null}
          {returnState === "cancelled" && !isPro ? (
            <p
              className="m-0 rounded-[14px] bg-surface-muted px-[13px] py-[11px] text-[0.875rem] text-muted"
              role="status"
            >
              Checkout was cancelled and you weren&apos;t charged. You can
              upgrade whenever you&apos;re ready.
            </p>
          ) : null}

          <FormSection title="Your plan">
            <p className="m-0 text-[0.95rem] text-ink">
              You&apos;re on the{" "}
              <strong>{isPro ? PLANS.PRO.label : PLANS.FREE.label}</strong>{" "}
              plan.
              {data.subscription && isPro
                ? ` Status: ${SUBSCRIPTION_STATUS_LABELS[data.subscription.status]}.`
                : ""}
            </p>
            {isPro && data.subscription?.endDate ? (
              <p className="m-0 text-[0.88rem] text-muted">
                Current period ends{" "}
                {dateFormatter.format(new Date(data.subscription.endDate))}.
              </p>
            ) : null}
            <p className="m-0 text-[0.88rem] text-muted">
              {isPro
                ? `${data.listingCount} ${data.listingCount === 1 ? "listing" : "listings"} (no limit on Pro).`
                : `${data.listingCount} of ${limit} included ${limit === 1 ? "listing" : "listings"} used.`}
            </p>
          </FormSection>

          <div className="grid gap-4 sm:grid-cols-2">
            <PlanCard current={!isPro} perks={PLANS.FREE.perks} planKey="FREE" />
            <PlanCard current={isPro} perks={PLANS.PRO.perks} planKey="PRO" />
          </div>

          {!isPro ? (
            <div className="grid gap-3">
              {upgradeError ? (
                <p
                  className="m-0 rounded-[14px] bg-surface-muted px-[13px] py-[11px] text-[0.875rem] text-danger"
                  role="alert"
                >
                  {upgradeError}
                </p>
              ) : null}
              <button
                className={primaryButtonClassName}
                disabled={isUpgrading}
                onClick={onUpgrade}
                type="button"
              >
                {isUpgrading
                  ? "Redirecting to checkout…"
                  : `Upgrade to Pro for ${currencyFormatter.format(PLANS.PRO.price)}`}
              </button>
              <p className="m-0 text-center text-[0.82rem] text-muted">
                You&apos;ll pay securely with Safepay and come back here
                afterwards.
              </p>
            </div>
          ) : null}
        </div>
      )}
    </main>
  );
}

export function OwnerSubscriptionPage({
  returnState,
}: {
  returnState: SubscriptionReturnState;
}) {
  const [data, setData] = useState<OwnerSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setLoadError(null);
    fetch("/api/owner/subscription", { signal: controller.signal })
      .then(async (response) => {
        const payload: unknown = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(
            readSubscriptionError(payload, "Could not load your subscription."),
          );
        }
        const parsed = parseSubscription(payload);
        if (!parsed) throw new Error("Could not load your subscription.");
        setData(parsed);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(
          error instanceof Error
            ? error.message
            : "Could not load your subscription.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [retryCount]);

  const upgrade = useCallback(async () => {
    setIsUpgrading(true);
    setUpgradeError(null);
    try {
      const response = await fetch("/api/owner/subscription", {
        method: "POST",
      });
      const payload: unknown = await response.json().catch(() => null);
      const checkoutUrl = response.ok ? parseCheckoutUrl(payload) : null;
      if (!checkoutUrl) {
        setUpgradeError(
          readSubscriptionError(
            payload,
            "We couldn't start checkout. Please try again.",
          ),
        );
        setIsUpgrading(false);
        return;
      }
      window.location.assign(checkoutUrl);
    } catch {
      setUpgradeError("We couldn't start checkout. Please try again.");
      setIsUpgrading(false);
    }
  }, []);

  return (
    <OwnerSubscriptionContent
      data={data}
      isLoading={isLoading}
      isUpgrading={isUpgrading}
      loadError={loadError}
      onRetry={() => setRetryCount((count) => count + 1)}
      onUpgrade={() => void upgrade()}
      returnState={returnState}
      upgradeError={upgradeError}
    />
  );
}
