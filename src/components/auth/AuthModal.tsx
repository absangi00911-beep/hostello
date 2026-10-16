"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

export function AuthModal({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  const router = useRouter();

  return (
    <Dialog open onOpenChange={(open) => !open && router.back()}>
      <DialogContent className="fixed inset-0 left-0 top-0 block h-[100dvh] max-h-none w-full max-w-none translate-x-0 translate-y-0 overflow-y-auto rounded-none border-0 bg-[var(--color-bg-card)] p-0 shadow-none sm:inset-auto sm:left-1/2 sm:top-1/2 sm:h-auto sm:max-h-[min(90dvh,800px)] sm:w-[min(100%-2rem,480px)] sm:max-w-[480px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[var(--radius-lg)] sm:border sm:p-6 sm:shadow-[var(--shadow-xl)]">
        <DialogTitle className="sr-only">{heading}</DialogTitle>
        <DialogDescription className="sr-only">
          Sign in or create a HostelLo account.
        </DialogDescription>
        {children}
      </DialogContent>
    </Dialog>
  );
}
