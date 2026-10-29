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
      <LoginDialogTrigger
        className="browse-sign-in grid size-[42px] place-items-center rounded-full border border-line text-ink transition-[box-shadow,background-color] duration-[160ms] hover:bg-surface-muted hover:shadow-[0_2px_5px_rgb(29_42_34_/_12%)] [@media(max-width:420px)]:size-9"
        ariaLabel="Sign in"
      >
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
        className="browse-account-trigger inline-flex max-w-[220px] cursor-pointer items-center gap-2 rounded-full border border-line bg-white py-[5px] pr-[10px] pl-[6px] text-ink transition-[box-shadow,background-color] duration-[160ms] hover:bg-surface-muted hover:shadow-[0_2px_5px_rgb(29_42_34_/_12%)] data-[state=open]:bg-surface-muted data-[state=open]:shadow-[0_2px_5px_rgb(29_42_34_/_12%)]"
      >
        <span
          aria-hidden="true"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand text-[0.82rem] font-bold text-white"
        >
          {user.avatar ? (
            <Image
              alt=""
              className="h-full w-full rounded-full object-cover"
              height={32}
              src={user.avatar}
              unoptimized
              width={32}
            />
          ) : (
            initial
          )}
        </span>
        <span className="max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap text-[0.82rem] font-semibold [@media(max-width:720px)]:hidden">
          {displayName}
        </span>
        <ChevronDown aria-hidden="true" size={15} />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          className="z-[1100] min-w-[220px] rounded-xl border border-line bg-white p-2 text-ink shadow-[0_8px_24px_rgb(29_42_34_/_14%)]"
          sideOffset={8}
        >
          <DropdownMenu.Label className="overflow-hidden px-[9px] py-[7px] text-ellipsis whitespace-nowrap text-[0.9rem] font-[650]">
            {displayName}
          </DropdownMenu.Label>
          {user.email && (
            <div className="overflow-hidden px-[9px] pt-0 pb-[7px] text-ellipsis whitespace-nowrap text-[0.78rem] text-muted">
              {user.email}
            </div>
          )}
          <DropdownMenu.Separator className="my-[5px] h-px bg-line" />
          {errorMessage && (
            <p
              className="mx-[9px] my-[5px] text-[0.78rem] text-[#a12622]"
              role="alert"
            >
              {errorMessage}
            </p>
          )}
          <DropdownMenu.Item
            className="cursor-pointer rounded-[7px] p-[9px] text-[0.86rem] outline-none hover:bg-surface-muted focus-visible:bg-surface-muted data-[disabled]:cursor-wait data-[disabled]:opacity-60"
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
