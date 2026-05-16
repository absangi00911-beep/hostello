// Path: src/app/booking/[id]/payment/loading.tsx
import { SkeletonDetailPage } from "@/components/ui/shared";
import { PublicLayout } from "@/components/layout/PublicLayout";

export default function PaymentLoading() {
  return (
    <PublicLayout>
      <SkeletonDetailPage />
    </PublicLayout>
  );
}