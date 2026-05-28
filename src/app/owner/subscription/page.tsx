"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Check, Zap, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PLANS, type PlanKey } from "@/config/plans";
import { formatPKR } from "@/components/ui/shared";
import { PageSpinner } from "@/components/ui/shared";

interface SubData {
  plan: PlanKey;
  listingCount: number;
  subscription: { status: string; endDate: string | null } | null;
}

function PlanCard({
  planKey,
  currentPlan,
  listingCount,
  onUpgrade,
  upgrading,
}: {
  planKey: PlanKey;
  currentPlan: PlanKey;
  listingCount: number;
  onUpgrade: () => void;
  upgrading: boolean;
}) {
  const plan   = PLANS[planKey];
  const active = currentPlan === planKey;
  const isPro  = planKey === "PRO";

  return (
    <div className={`relative flex flex-col rounded-[var(--radius-xl)] border p-6 transition-shadow
      ${active
        ? "border-[var(--color-primary)] shadow-[0_0_0_3px_oklch(0.62_0.17_65_/_0.15)]"
        : "border-[var(--color-border-subtle)]"}`}>

      {isPro && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary)] px-3 py-0.5 text-[11px] font-[700] text-white uppercase tracking-wide">
            <Zap size={10} strokeWidth={2.5} aria-hidden="true" />
            Recommended
          </span>
        </div>
      )}

      <p className="text-[var(--text-body-sm)] font-[500] text-[var(--color-text-muted)] mb-1">
        {plan.label}
      </p>

      <div className="flex items-baseline gap-1 mb-5">
        {plan.price === 0 ? (
          <span className="text-[2.25rem] font-[800] text-[var(--color-text-heading)]"
                style={{ fontFamily: "var(--font-heading)" }}>Free</span>
        ) : (
          <>
            <span className="text-[2.25rem] font-[800] text-[var(--color-text-heading)]"
                  style={{ fontFamily: "var(--font-heading)" }}>
              {formatPKR(plan.price)}
            </span>
            <span className="text-[var(--text-body-sm)] text-[var(--color-text-muted)]">/mo</span>
          </>
        )}
      </div>

      <ul className="space-y-2.5 mb-6 flex-1">
        {plan.perks.map((perk) => (
          <li key={perk} className="flex items-start gap-2">
            <Check size={15} strokeWidth={2.5}
              className="shrink-0 mt-0.5 text-[var(--color-primary)]" aria-hidden="true" />
            <span className="text-[var(--text-body-sm)] text-[var(--color-text-body)]">{perk}</span>
          </li>
        ))}
      </ul>

      {/* Listing usage — FREE only */}
      {planKey === "FREE" && (
        <div className="mb-4 rounded-[var(--radius-md)] bg-[var(--color-bg-sidebar)] px-3 py-2">
          <div className="flex justify-between text-[var(--text-caption)] text-[var(--color-text-muted)] mb-1">
            <span>Listings used</span>
            <span>{listingCount} / {PLANS.FREE.maxListings}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[var(--color-border-default)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--color-primary)] transition-all"
              style={{ width: `${Math.min((listingCount / PLANS.FREE.maxListings) * 100, 100)}%` }}
              role="progressbar"
              aria-valuenow={listingCount}
              aria-valuemax={PLANS.FREE.maxListings}
            />
          </div>
        </div>
      )}

      {active ? (
        <div className="h-10 flex items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-primary)] text-[var(--text-body-sm)] font-[500] text-[var(--color-primary)]">
          Current plan
        </div>
      ) : (
        <button
          onClick={onUpgrade}
          disabled={upgrading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white text-[var(--text-body-sm)] font-[500] hover:bg-[var(--color-primary-deep)] disabled:opacity-50 transition-colors"
        >
          {upgrading
            ? <Loader2 size={15} strokeWidth={1.5} className="animate-spin" />
            : <><span>Upgrade to Pro</span><ArrowRight size={14} strokeWidth={1.5} /></>}
        </button>
      )}
    </div>
  );
}

export default function OwnerSubscriptionPage() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const { data, isLoading } = useQuery<SubData>({
    queryKey: ["owner-subscription"],
    queryFn: () => fetch("/api/owner/subscription").then((r) => r.json()),
  });

  const upgradeMutation = useMutation({
    mutationFn: () =>
      fetch("/api/owner/subscription", { method: "POST" }).then((r) => r.json()),
    onSuccess: (json) => {
      if (json.error) { toast.error(json.error); return; }
      window.location.href = json.checkoutUrl;
    },
    onError: () => toast.error("Something went wrong. Please try again."),
  });

  // Handle return from Safepay
  useEffect(() => {
    if (searchParams.get("upgraded") === "1") {
      toast.success("You're on Pro! Unlimited listings are now enabled.");
      router.replace("/owner/subscription");
    }
    if (searchParams.get("cancelled") === "1") {
      toast.info("Upgrade cancelled — you're still on the Free plan.");
      router.replace("/owner/subscription");
    }
  }, [searchParams, router]);

  if (isLoading || !data) return <PageSpinner />;

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-[var(--text-h3)] font-[700] text-[var(--color-text-heading)] mb-1"
            style={{ fontFamily: "var(--font-heading)" }}>
          Subscription
        </h1>
        <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
          Manage your HostelLo plan.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {(["FREE", "PRO"] as PlanKey[]).map((key) => (
          <PlanCard
            key={key}
            planKey={key}
            currentPlan={data.plan}
            listingCount={data.listingCount}
            onUpgrade={() => upgradeMutation.mutate()}
            upgrading={upgradeMutation.isPending}
          />
        ))}
      </div>

      {data.subscription?.status === "ACTIVE" && data.subscription.endDate && (
        <p className="mt-6 text-[var(--text-caption)] text-[var(--color-text-muted)] text-center">
          Your Pro plan renews on{" "}
          {new Date(data.subscription.endDate).toLocaleDateString("en-PK", {
            day: "numeric", month: "long", year: "numeric",
          })}
          . To cancel, contact support.
        </p>
      )}
    </div>
  );
}
