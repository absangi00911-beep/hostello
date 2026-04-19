import type { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { CreateHostelForm } from "@/components/features/dashboard/create-hostel-form";

export const metadata: Metadata = { title: "List a Hostel" };

export default async function NewHostelPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1
            className="text-2xl sm:text-3xl font-bold text-[var(--color-text)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            List your hostel
          </h1>
          <p className="text-sm text-[var(--color-muted)] mt-1.5">
            Fill in the details below. You can save as a draft and publish later.
          </p>
        </div>
        <CreateHostelForm />
      </div>
    </div>
  );
}
