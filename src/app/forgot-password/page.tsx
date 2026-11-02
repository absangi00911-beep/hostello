import type { Metadata } from "next";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = { title: "Reset password | HostelLo" };

export default function ForgotPasswordPage() {
  return (
    <AuthPageShell
      description="Enter your email and we'll send you a link to choose a new password."
      title="Forgot your password?"
    >
      <ForgotPasswordForm />
    </AuthPageShell>
  );
}
