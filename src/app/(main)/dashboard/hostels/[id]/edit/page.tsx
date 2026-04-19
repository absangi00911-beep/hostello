import type { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { EditHostelForm } from "@/components/features/dashboard/edit-hostel-form";

export const metadata: Metadata = { title: "Edit Hostel" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditHostelPage({ params }: PageProps) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { id } = await params;

  const hostel = await db.hostel.findUnique({
    where: { id },
    select: {
      id: true, name: true, description: true,
      city: true, area: true, address: true,
      pricePerMonth: true, rooms: true, capacity: true,
      gender: true, minStay: true, maxStay: true,
      amenities: true, rules: true,
      images: true, coverImage: true,
      status: true, ownerId: true,
    },
  });

  if (!hostel) notFound();

  // Only the owner (or admin) can edit
  if (hostel.ownerId !== session.user.id && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen pt-20 pb-16 bg-[var(--color-ground)]">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="py-10">
          <p className="text-xs font-bold tracking-widest text-[var(--color-brand-700)] uppercase mb-2">
            Edit listing
          </p>
          <h1
            className="text-3xl sm:text-4xl font-extrabold text-[var(--color-ink)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {hostel.name}
          </h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            Changes go live immediately.
          </p>
        </div>

        <EditHostelForm hostel={hostel} />
      </div>
    </div>
  );
}
