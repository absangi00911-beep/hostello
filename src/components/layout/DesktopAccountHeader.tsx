import {
  BrowseAccountMenu,
  type BrowseAccountUser,
} from "@/components/auth/BrowseAccountMenu";
import { HostelloBrand } from "@/components/brand/HostelloBrand";
import { ScrollAwareSurface } from "./ScrollAwareSurface";

export function DesktopAccountHeader({
  user,
}: {
  user: BrowseAccountUser;
}) {
  return (
    <ScrollAwareSurface
      as="header"
      className="sticky top-0 z-30 bg-[#fcfcfb] [@media(max-width:720px)]:hidden"
      scrolledClassName="shadow-[0_4px_12px_rgb(0_0_0_/_8%)]"
    >
      <div className="mx-auto flex min-h-20 w-[min(1920px,calc(100%-var(--page-gutter-total)))] items-center justify-between [@media(max-width:960px)]:w-[min(calc(100%-var(--page-gutter-tablet)),1344px)]">
        <HostelloBrand className="inline-flex w-fit items-center text-xl font-[750] tracking-[-0.045em] text-brand [font-family:'Arial_Rounded_MT_Bold','Trebuchet_MS',var(--font-inter),sans-serif]" />
        <BrowseAccountMenu user={user} />
      </div>
    </ScrollAwareSurface>
  );
}
