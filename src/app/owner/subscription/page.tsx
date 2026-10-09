"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { InlineError, PageSpinner } from "@/components/ui/shared";
import type { PlanKey } from "@/config/plans";

interface SubscriptionData {
  plan: PlanKey;
  listingCount: number;
  subscription: { status: string; startDate: string | null; endDate: string | null } | null;
}

export default function OwnerSubscriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, isLoading, isError } = useQuery<SubscriptionData>({
    queryKey: ["owner-subscription"],
    queryFn: async () => {
      const response = await fetch("/api/owner/subscription");
      if (!response.ok) throw new Error("Couldn't load plan status");
      return response.json();
    },
  });

  useEffect(() => {
    if (searchParams.get("upgraded") === "1" && data?.plan === "PRO") {
      toast.success("Your Pro subscription is active.");
      router.replace("/owner/subscription");
    }
    if (searchParams.get("cancelled") === "1") {
      toast.info("Checkout was cancelled. Your current plan is unchanged.");
      router.replace("/owner/subscription");
    }
  }, [data?.plan, router, searchParams]);

  if (isLoading) return <PageSpinner label="Loading plan status…" />;
  if (isError || !data) return <InlineError message="Couldn't load your plan status. Please refresh." />;

  return (
    <div className="owner-subscription-page max-w-2xl space-y-5">
      <header className="student-page-heading">
        <div className="student-page-overline"><span>OWNER ACCOUNT</span><span>PLAN STATUS</span></div>
        <h2>Your plan</h2>
        <p>View your current plan and subscription status.</p>
      </header>

      <section className="rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-6">
        <p className="text-[length:var(--text-caption)] font-[600] uppercase tracking-wide text-[color:var(--color-text-muted)]">
          Current plan
        </p>
        <h3 className="mt-2 font-heading text-[length:var(--text-h3)] font-[700] text-[color:var(--color-text-heading)]">
          {data.plan === "PRO" ? "Pro" : "Free"}
        </h3>
        <p className="mt-1 text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)]">
          {data.plan === "PRO" ? "Your current Pro benefits remain active." : `${data.listingCount} of 1 listing used.`}
        </p>

        {data.subscription && (
          <div className="mt-5 border-t border-[var(--color-border-subtle)] pt-4">
            <p className="text-[length:var(--text-body-sm)] text-[color:var(--color-text-body)]">
              Subscription status: <strong>{data.subscription.status.toLowerCase()}</strong>
            </p>
            {data.subscription.endDate && (
              <p className="mt-1 text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">
                Current term ends {new Date(data.subscription.endDate).toLocaleDateString("en-PK", {
                  day: "numeric", month: "long", year: "numeric",
                })}.
              </p>
            )}
          </div>
        )}
      </section>

      <p className="text-[length:var(--text-caption)] leading-relaxed text-[color:var(--color-text-muted)]">
        Plan changes are paused while we focus on core booking and listing tools. Existing subscriptions continue under their current terms.
      </p>
    </div>
  );
}
