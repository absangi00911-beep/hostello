import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  solid?: boolean;
  size?: "sm" | "md" | "lg";
}

export function Logo({ solid = true, size = "md" }: LogoProps) {
  return (
    <Link href="/" className="flex items-center gap-2.5 group" aria-label="HostelLo">
      {/* Mark — green square */}
      <div
        className={cn(
          "rounded-xl flex items-center justify-center font-extrabold flex-shrink-0 transition-transform group-hover:scale-95",
          size === "sm" && "w-7 h-7 text-sm",
          size === "md" && "w-8 h-8 text-base",
          size === "lg" && "w-10 h-10 text-xl",
          solid
            ? "bg-[var(--color-brand-500)] text-[var(--color-ink)]"
            : "bg-[var(--color-brand-500)] text-[var(--color-ink)]"
        )}
        style={{ fontFamily: "var(--font-display)" }}
      >
        H
      </div>

      {/* Wordmark */}
      <span
        className={cn(
          "font-extrabold tracking-tight transition-colors",
          size === "sm" && "text-base",
          size === "md" && "text-lg",
          size === "lg" && "text-2xl",
          solid ? "text-[var(--color-ink)]" : "text-white"
        )}
        style={{ fontFamily: "var(--font-display)" }}
      >
        Hostel<span className="text-[var(--color-brand-500)]">Lo</span>
      </span>
    </Link>
  );
}
