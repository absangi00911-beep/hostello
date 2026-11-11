import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { SignupForm } from "@/components/auth/SignupForm";
import { auth } from "@/lib/auth/config";

export const metadata: Metadata = { title: "Create account" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string | string[] }>;
}) {
  const session = await auth();
  if (session) redirect("/");

  const { role } = await searchParams;
  const initialRole = role === "OWNER" ? "OWNER" : "STUDENT";

  return (
    <AuthPageShell
      description="Find a hostel as a student or list yours as an owner."
      title="Create your account"
    >
      <SignupForm initialRole={initialRole} />
    </AuthPageShell>
  );
}
