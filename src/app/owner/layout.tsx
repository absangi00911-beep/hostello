// Path: src/app/owner/layout.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { OwnerLayout } from "@/components/layout/OwnerLayout";

export default async function OwnerRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) redirect("/login?callbackUrl=/owner/dashboard");

  if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
    redirect("/");
  }

  return <OwnerLayout>{children}</OwnerLayout>;
}
