// Path: src/app/profile/settings/loading.tsx
import { SkeletonLine } from "@/components/ui/shared";
import { PublicLayout } from "@/components/layout/PublicLayout";

export default function ProfileSettingsLoading() {
  return (
    <PublicLayout>
      <div className="container-app max-w-[680px] py-10 animate-pulse space-y-8">
        {/* Page title */}
        <SkeletonLine width="35%" height="28px" />

        {/* Avatar + name section */}
        <div
          className="rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-6 space-y-4"
        >
          <div className="flex items-center gap-4">
            <div className="skeleton h-16 w-16 rounded-full shrink-0" />
            <div className="space-y-2 flex-1">
              <SkeletonLine width="40%" height="18px" />
              <SkeletonLine width="55%" height="13px" />
            </div>
          </div>
          <SkeletonLine width="100%" height="40px" />
          <SkeletonLine width="100%" height="40px" />
        </div>

        {/* Security section */}
        <div
          className="rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-6 space-y-4"
        >
          <SkeletonLine width="25%" height="18px" />
          <SkeletonLine width="100%" height="40px" />
          <SkeletonLine width="100%" height="40px" />
          <SkeletonLine width="100%" height="40px" />
        </div>

        {/* Notifications section */}
        <div
          className="rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-6 space-y-4"
        >
          <SkeletonLine width="30%" height="18px" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <SkeletonLine width="45%" height="14px" />
              <div className="skeleton h-6 w-10 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}