// Path: src/app/booking/[id]/confirmation/loading.tsx
import { SkeletonDetailPage } from "@/components/ui/shared";
import { PublicLayout } from "@/components/layout/PublicLayout";

export default function ConfirmationLoading() {
  return (
    <PublicLayout>
      <SkeletonDetailPage />
    </PublicLayout>
  );
}