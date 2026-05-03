import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import HostelSettings from "@/components/features/dashboard/hostel-settings";

interface SettingsPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Hostel Settings - Owner Dashboard",
  description: "Manage hostel settings and policies",
};

export default async function SettingsPage({ params }: SettingsPageProps) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "OWNER") {
    redirect("/login");
  }

  const { id } = await params;

  // Fetch hostel
  const hostel = await db.hostel.findUnique({
    where: { id },
    select: {
      id: true,
      ownerId: true,
      name: true,
      description: true,
      amenities: true,
      rules: true,
      status: true,
    },
  });

  if (!hostel) {
    redirect("/dashboard/listings");
  }

  // Check ownership
  if (hostel.ownerId !== session.user.id) {
    redirect("/dashboard/listings");
  }

  return (
    <main>
      <HostelSettings hostel={hostel} />
    </main>
  );
}
