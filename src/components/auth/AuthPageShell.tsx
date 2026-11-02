import Link from "next/link";
import type { ReactNode } from "react";

export const authInputClassName =
  "min-h-[50px] w-full rounded-[8px] border border-muted bg-white px-[13px] text-base text-ink focus-visible:border-brand! focus-visible:outline-brand!";

export const authButtonClassName =
  "mt-[2px] inline-flex min-h-[50px] cursor-pointer items-center justify-center rounded-[8px] border-0 bg-brand px-4 text-base font-[650] text-white no-underline enabled:hover:bg-brand-dark disabled:cursor-wait disabled:opacity-70";

export const authLinkClassName =
  "font-semibold text-brand hover:underline focus-visible:outline-brand!";

export function AuthNotice({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "error" | "success";
}) {
  return (
    <p
      className={`mb-4 rounded-[14px] px-[13px] py-[11px] text-[0.875rem] leading-[1.45] ${
        tone === "error"
          ? "bg-surface-muted text-[#c13515]"
          : "bg-brand-soft text-brand-dark"
      }`}
      role={tone === "error" ? "alert" : "status"}
    >
      {children}
    </p>
  );
}

export function AuthPageShell({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="px-6 py-5">
        <Link
          className="text-[1.25rem] font-extrabold tracking-tight text-brand-dark"
          href="/"
        >
          HostelLo
        </Link>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-6">
        <div className="w-full max-w-[440px] rounded-[16px] border border-line bg-surface p-6 shadow-[0_8px_24px_rgb(15_23_42_/_6%)] sm:p-8">
          <h1 className="m-0 text-[1.5rem] font-bold leading-tight text-ink">
            {title}
          </h1>
          {description ? (
            <p className="mb-5 mt-2 text-[0.95rem] text-muted">{description}</p>
          ) : (
            <div className="mb-5" />
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
