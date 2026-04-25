import type { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { PriceAlertsPage } from "@/components/features/profile/price-alerts-page";

export const metadata: Metadata = { title: "Price Alerts" };

export default async function PriceAlertsRoute() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen pt-20 pb-16 bg-[var(--color-ground)]">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="py-10">
          <p className="text-xs font-bold tracking-widest text-[var(--color-brand-700)] uppercase mb-2">
            Price monitoring
          </p>
          <h1
            className="text-3xl sm:text-4xl font-extrabold text-[var(--color-ink)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Price alerts
          </h1>
          <p className="text-sm text-[var(--color-muted)] mt-2">
            Monitor hostels and get notified when prices drop below your target
          </p>
        </div>

        {/* Alerts List */}
        <PriceAlertsPage />
      </div>
    </div>
  );
}
