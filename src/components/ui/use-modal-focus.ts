"use client";

import { useEffect, useEffectEvent, type RefObject } from "react";
import { getDialogFocusBoundaryTarget } from "@/lib/dialog-focus";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const activeDialogStack: HTMLElement[] = [];

interface UseModalFocusOptions<TDialog extends HTMLElement> {
  dialogRef: RefObject<TDialog | null>;
  initialFocusRef?: RefObject<HTMLElement | null>;
  returnFocusRef?: RefObject<HTMLElement | null>;
  onEscape?: () => void;
}

/** Manage focus for the small set of app-owned modal surfaces. */
export function useModalFocus<TDialog extends HTMLElement>({
  dialogRef,
  initialFocusRef,
  returnFocusRef,
  onEscape,
}: UseModalFocusOptions<TDialog>) {
  const handleEscape = useEffectEvent(() => onEscape?.());

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const previousOverflow = document.body.style.overflow;
    const previousFocus =
      returnFocusRef?.current ??
      (document.activeElement instanceof HTMLElement ? document.activeElement : null);

    activeDialogStack.push(dialog);
    document.body.style.overflow = "hidden";

    const preferredFocus = initialFocusRef?.current;
    const firstFocusable = dialog.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    (preferredFocus && dialog.contains(preferredFocus) ? preferredFocus : firstFocusable)?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (activeDialogStack[activeDialogStack.length - 1] !== dialog) return;

      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        handleEscape();
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((element) =>
        element.tabIndex >= 0 &&
        !element.matches(":disabled") &&
        element.getClientRects().length > 0 &&
        getComputedStyle(element).visibility !== "hidden" &&
        !element.closest("[hidden], [inert], [aria-hidden='true']"),
      );

      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const target = getDialogFocusBoundaryTarget(
        document.activeElement instanceof HTMLElement ? document.activeElement : null,
        focusableElements,
        event.shiftKey,
      );
      if (target) {
        event.preventDefault();
        target.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      const stackIndex = activeDialogStack.lastIndexOf(dialog);
      if (stackIndex !== -1) activeDialogStack.splice(stackIndex, 1);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [dialogRef, initialFocusRef, returnFocusRef]);
}
