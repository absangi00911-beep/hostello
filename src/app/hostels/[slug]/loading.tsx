// Path: src/app/hostels/[slug]/loading.tsx
import { SkeletonHostelDetail } from "@/components/ui/shared";
import { PublicLayout } from "@/components/layout/PublicLayout";

export default function HostelDetailLoading() {
  return (
    <PublicLayout>
      <SkeletonHostelDetail />
    </PublicLayout>
  );
}