"use client";

import Link from "next/link";
import type { ReactNode, MouseEvent } from "react";
import { useLoginDialog } from "./LoginDialogProvider";

export function LoginDialogTrigger({
  ariaLabel,
  children,
  className,
}: {
  ariaLabel?: string;
  children: ReactNode;
  className?: string;
}) {
  const { openLogin } = useLoginDialog();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    openLogin(`${window.location.pathname}${window.location.search}`);
  }

  return (
    <Link
      aria-label={ariaLabel}
      className={className}
      href="/login"
      onClick={handleClick}
    >
      {children}
    </Link>
  );
}
