"use client";

import Link from "next/link";
import { BrowseAccountMenu, type BrowseAccountUser } from "./BrowseAccountMenu";

export function BrowseAccountActions({
  user,
}: {
  user: BrowseAccountUser | null;
}) {
  return (
    <div className="browse-account-actions flex items-center justify-self-end gap-4 [@media(max-width:420px)]:gap-[9px]">
      {user?.role !== "STUDENT" && (
        <Link
          className="browse-host-link whitespace-nowrap text-[0.82rem] font-semibold hover:underline hover:underline-offset-[3px] [@media(max-width:420px)]:text-[0.75rem]"
          href="/signup?role=OWNER"
        >
          Become a host
        </Link>
      )}
      <BrowseAccountMenu user={user} />
    </div>
  );
}
