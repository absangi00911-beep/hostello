"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ChevronDown, UserRound } from "lucide-react";
import { useState } from "react";
import { LoginDialogTrigger } from "./LoginDialogTrigger";

export interface BrowseAccountUser {
  name?: string | null;
  email?: string | null;
  avatar?: string | null;
  role: "STUDENT" | "OWNER" | "ADMIN";
}

export function BrowseAccountMenu({
  user,
}: {
  user: BrowseAccountUser | null;
}) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!user) {
    return (
      <LoginDialogTrigger className="browse-sign-in" ariaLabel="Sign in">
        <UserRound aria-hidden="true" size={18} />
      </LoginDialogTrigger>
    );
  }

  const displayName =
    user.name?.trim() || user.email?.split("@")[0] || "Account";
  const initial = Array.from(displayName)[0]?.toLocaleUpperCase() ?? "A";

  async function handleSignOut() {
    setErrorMessage(null);
    setIsSigningOut(true);
    try {
      await signOut({ redirect: false });
      router.refresh();
    } catch {
      setErrorMessage("We couldn't sign you out. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label={`Account menu for ${displayName}`}
        className="browse-account-trigger"
      >
        <span aria-hidden="true" className="browse-account-avatar">
          {user.avatar ? (
            <Image alt="" height={32} src={user.avatar} unoptimized width={32} />
          ) : (
            initial
          )}
        </span>
        <span className="browse-account-name">{displayName}</span>
        <ChevronDown aria-hidden="true" size={15} />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          className="browse-account-menu"
          sideOffset={8}
        >
          <DropdownMenu.Label className="browse-account-menu-name">
            {displayName}
          </DropdownMenu.Label>
          {user.email && (
            <div className="browse-account-menu-email">{user.email}</div>
          )}
          <DropdownMenu.Separator className="browse-account-menu-separator" />
          {errorMessage && (
            <p className="browse-account-menu-error" role="alert">
              {errorMessage}
            </p>
          )}
          <DropdownMenu.Item
            className="browse-account-menu-item"
            disabled={isSigningOut}
            onSelect={(event) => {
              event.preventDefault();
              void handleSignOut();
            }}
          >
            {isSigningOut ? "Signing out…" : "Sign out"}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
