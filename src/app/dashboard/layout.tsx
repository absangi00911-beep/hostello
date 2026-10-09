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
  if (session.user.role === "OWNER") redirect("/owner/dashboard");
  if (session.user.role === "ADMIN") redirect("/admin");

  return (
    <PublicLayout noFooter>
      {/* Constrained to 1024px per spec */}
      <div className="student-dashboard-shell mx-auto w-full max-w-[1120px] px-4 md:px-6 py-6 pb-24 md:py-10 md:pb-12">
        {/* Page heading */}
        <div className="student-dashboard-masthead mb-6">
          <div className="student-dashboard-topline">
            <span>HOSTELLO · STUDENT FIELD DESK</span>
            <span>ACCOUNT / 01</span>
          </div>
          <h1
            className="student-dashboard-title text-[color:var(--color-text-heading)]"

          >
            My account
          </h1>
          <p className="text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)] mt-1">
            Manage your bookings, saved hostels, and messages.
          </p>
        </div>

        {/* Tab navigation */}
        <DashboardTabs />

        {/* Tab content */}
        <div className="student-dashboard-content mt-6">{children}</div>
      </div>
    </PublicLayout>
  );
}
