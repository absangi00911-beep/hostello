"use client";

import Link from "next/link";
import { BrowseAccountMenu, type BrowseAccountUser } from "./BrowseAccountMenu";

export function BrowseAccountActions({
  user,
}: {
  user: BrowseAccountUser | null;
}) {
  return (
    <div className="browse-account-actions">
      {user?.role !== "STUDENT" && (
        <Link className="browse-host-link" href="/signup?role=OWNER">
          Become a host
        </Link>
      )}
      <BrowseAccountMenu user={user} />
    </div>
  );
}
