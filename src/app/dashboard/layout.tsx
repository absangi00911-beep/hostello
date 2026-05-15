// Path: src/app/dashboard/layout.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { DashboardTabs } from "./DashboardTabs";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/dashboard/bookings");

  return (
    <PublicLayout noFooter>
      {/* Constrained to 1024px per spec */}
      <div className="mx-auto w-full max-w-[1024px] px-4 md:px-6 py-6 pb-24 md:pb-10">
        {/* Page heading */}
        <div className="mb-6">
          <h1
            className="text-[var(--text-h2)] font-[700] text-[var(--color-text-heading)] tracking-[-0.02em]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            My account
          </h1>
          <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)] mt-1">
            Manage your bookings, saved hostels, and messages.
          </p>
        </div>

        {/* Tab navigation */}
        <DashboardTabs />

        {/* Tab content */}
        <div className="mt-6">{children}</div>
      </div>
    </PublicLayout>
  );
}