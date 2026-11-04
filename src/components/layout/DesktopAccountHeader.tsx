import type { BrowseAccountUser } from "@/components/auth/BrowseAccountMenu";
import { SiteHeader } from "./SiteHeader";

/** Kept so existing pages keep working; new code should use SiteHeader. */
export function DesktopAccountHeader({ user }: { user: BrowseAccountUser }) {
  return <SiteHeader user={user} />;
}
