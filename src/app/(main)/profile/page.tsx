import type { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ProfileForm } from "@/components/features/profile/profile-form";

export const metadata: Metadata = { title: "My Profile" };

export default async function ProfilePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, name: true, email: true, phone: true,
      bio: true, city: true, avatar: true, role: true,
    },
  });

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen pt-20 pb-16 bg-[var(--color-ground)]">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="py-10">
          <p className="text-xs font-bold tracking-widest text-[var(--color-brand-700)] uppercase mb-2">
            Account
          </p>
          <h1
            className="text-3xl sm:text-4xl font-extrabold text-[var(--color-ink)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Your profile
          </h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            This is what owners and students see about you.
          </p>
        </div>
        <ProfileForm user={user} />
      </div>
    </div>
  );
}
