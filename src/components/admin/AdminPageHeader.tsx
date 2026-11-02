import {
  BrowseAccountMenu,
  type BrowseAccountUser,
} from "@/components/auth/BrowseAccountMenu";
import { HostelloBrand } from "@/components/brand/HostelloBrand";
import { ScrollAwareSurface } from "@/components/layout/ScrollAwareSurface";

/**
 * Header for admin pages. Admins have no mobile tab bar either, so it stays
 * visible at every width to keep the account menu reachable on phones.
 */
export function AdminPageHeader({ user }: { user: BrowseAccountUser }) {
  return (
    <ScrollAwareSurface
      as="header"
      className="sticky top-0 z-30 bg-[#fcfcfb]"
      scrolledClassName="shadow-[0_4px_12px_rgb(0_0_0_/_8%)]"
    >
      <div className="mx-auto flex min-h-16 w-[min(1920px,calc(100%-var(--page-gutter-mobile)))] items-center justify-between md:min-h-20 md:w-[min(1920px,calc(100%-var(--page-gutter-total)))]">
        <HostelloBrand className="inline-flex w-fit items-center text-xl font-[750] tracking-[-0.045em] text-brand [font-family:'Arial_Rounded_MT_Bold','Trebuchet_MS',var(--font-inter),sans-serif]" />
        <BrowseAccountMenu user={user} />
      </div>
    </ScrollAwareSurface>
  );
}
