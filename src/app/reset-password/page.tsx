import type { Metadata } from "next";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Choose a new password | HostelLo",
  // Keep the one-time token out of the Referer header sent to other sites.
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token } = await searchParams;

  return (
    <AuthPageShell title="Choose a new password">
      <ResetPasswordForm token={typeof token === "string" ? token : null} />
    </AuthPageShell>
  );
}
