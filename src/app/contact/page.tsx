import type { Metadata } from "next";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { ContactForm } from "@/components/auth/ContactForm";
import { auth } from "@/lib/auth/config";

export const metadata: Metadata = { title: "Contact us | HostelLo" };

export default async function ContactPage() {
  const session = await auth();

  return (
    <AuthPageShell
      description="Questions about a booking, a listing, or your account? Send us a message and we'll reply by email."
      title="Contact us"
    >
      <ContactForm
        defaultEmail={session?.user.email ?? ""}
        defaultName={session?.user.name ?? ""}
      />
    </AuthPageShell>
  );
}
