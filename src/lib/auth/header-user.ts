import type { BrowseAccountUser } from "@/components/auth/BrowseAccountMenu";
import { auth } from "./config";

/** The signed-in user in the shape the shared header expects, or null. */
export async function getHeaderUser(): Promise<BrowseAccountUser | null> {
  const session = await auth();
  if (!session?.user) return null;

  return {
    name: session.user.name,
    email: session.user.email,
    avatar: session.user.image,
    role: session.user.role,
  };
}
