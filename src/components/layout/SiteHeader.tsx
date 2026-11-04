import type { ReactNode } from "react";
import {
  BrowseAccountMenu,
  type BrowseAccountUser,
} from "@/components/auth/BrowseAccountMenu";
import { HostelloBrand } from "@/components/brand/HostelloBrand";
import { ScrollAwareSurface } from "./ScrollAwareSurface";

const brandClassName =
  "inline-flex w-fit items-center text-xl font-[750] tracking-[-0.045em] text-brand [font-family:'Arial_Rounded_MT_Bold','Trebuchet_MS',var(--font-inter),sans-serif]";

/**
 * The one shared site header: brand on the left, account menu on the right.
 * Pages that need extra controls (the home page's category tabs) pass them
 * through `center` / `actions` instead of composing their own header.
 *
 * `hideOnMobile` defaults to true because guests and students get the bottom
 * tab bar on phones; owner/admin pages pass false to keep the account menu.
 */
export function SiteHeader({
  actions,
  center,
  hideOnMobile = true,
  user,
}: {
  actions?: ReactNode;
  center?: ReactNode;
  hideOnMobile?: boolean;
  user: BrowseAccountUser | null;
}) {
  const hidden = hideOnMobile ? "[@media(max-width:720px)]:hidden" : "";

  if (center) {
    return (
      <ScrollAwareSurface
        as="header"
        className={`bg-[#fcfcfb] ${hidden} sticky top-0 z-30`}
        scrolledClassName="shadow-[0_4px_12px_rgb(0_0_0_/_8%)]"
      >
        <div className="mx-auto grid min-h-20 w-[min(1920px,calc(100%-var(--page-gutter-total)))] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center [@media(max-width:960px)]:w-[min(calc(100%-var(--page-gutter-tablet)),1344px)] [@media(max-width:960px)]:grid-cols-[minmax(120px,1fr)_auto_minmax(140px,1fr)] [@media(max-width:720px)]:w-[min(calc(100%-var(--page-gutter-mobile)),600px)]! [@media(max-width:720px)]:pt-2 [@media(max-width:420px)]:w-[calc(100%-var(--page-gutter-mobile))] [@media(max-width:420px)]:min-h-[68px]">
          <HostelloBrand
            className={`${brandClassName} [@media(max-width:720px)]:hidden`}
          />
          {center}
          {actions ?? <BrowseAccountMenu user={user} />}
        </div>
      </ScrollAwareSurface>
    );
  }

  return (
    <ScrollAwareSurface
      as="header"
      className={`sticky top-0 z-30 bg-[#fcfcfb] ${hidden}`}
      scrolledClassName="shadow-[0_4px_12px_rgb(0_0_0_/_8%)]"
    >
      <div className="mx-auto flex min-h-20 w-[min(1920px,calc(100%-var(--page-gutter-total)))] items-center justify-between [@media(max-width:960px)]:w-[min(calc(100%-var(--page-gutter-tablet)),1344px)]">
        <HostelloBrand className={brandClassName} />
        {actions ?? <BrowseAccountMenu user={user} />}
      </div>
    </ScrollAwareSurface>
  );
}
