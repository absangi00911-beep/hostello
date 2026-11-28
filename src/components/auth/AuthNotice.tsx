"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Inline message for auth forms. Errors scroll themselves into view because the message sits
 * above the form while the submit button is below it, which on a phone with the keyboard open
 * would otherwise make a failed submit look like nothing happened. Pass `focusOnMount` for the
 * confirmation shown after a form is replaced, so keyboard and screen-reader users land on it.
 */
export function AuthNotice({
  children,
  focusOnMount = false,
  id,
  tone,
}: {
  children: ReactNode;
  focusOnMount?: boolean;
  id?: string;
  tone: "error" | "success";
}) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (focusOnMount) {
      element.focus();
    } else if (tone === "error") {
      element.scrollIntoView({ block: "nearest" });
    }
  }, [focusOnMount, tone]);

  return (
    <p
      className={`mb-4 scroll-mt-4 rounded-xl px-[13px] py-[11px] text-label leading-[1.45] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
        tone === "error"
          ? "bg-surface-muted text-danger"
          : "bg-brand-soft text-brand-dark"
      }`}
      id={id}
      ref={ref}
      role={tone === "error" ? "alert" : "status"}
      tabIndex={focusOnMount ? -1 : undefined}
    >
      {children}
    </p>
  );
}
