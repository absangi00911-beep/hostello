import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";

function homeForRole(role?: string | null) {
  if (role === "OWNER") return "/owner/dashboard";
  if (role === "ADMIN") return "/admin";
  return "/";
}

export default async function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (session) {
    redirect(homeForRole(session.user.role));
  }

  return children;
}
