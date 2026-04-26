import { auth } from "@/lib/auth/config";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { VerificationBanner } from "@/components/features/profile/verification-banner";
import { CompareBar } from "@/components/features/hostels/compare-bar";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Check whether the logged-in user has verified their email.
  // emailVerified is already in the session, populated from the JWT.
  const showVerificationBanner = session && !((session.user as unknown as { emailVerified?: boolean }).emailVerified);

  return (
    <>
      <Navbar />
      {showVerificationBanner && session && (
        <VerificationBanner email={session.user.email} />
      )}
      <main>{children}</main>
      <CompareBar />
      <Footer />
    </>
  );
}
