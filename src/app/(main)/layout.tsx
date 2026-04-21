import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { VerificationBanner } from "@/components/features/profile/verification-banner";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Check whether the logged-in user has verified their email.
  // We query directly rather than rely on the JWT so that a user who
  // just verified (and hasn't re-logged-in yet) still sees the banner.
  let showVerificationBanner = false;
  if (session?.user?.id) {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { emailVerified: true },
    });
    showVerificationBanner = !user?.emailVerified;
  }

  return (
    <>
      <Navbar />
      {showVerificationBanner && session && (
        <VerificationBanner email={session.user.email} />
      )}
      <main>{children}</main>
      <Footer />
    </>
  );
}
