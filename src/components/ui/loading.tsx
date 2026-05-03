"use client";

import { Loader2, Loader, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

export function Spinner({ size = "md", className }: SpinnerProps) {
  const sizeClass = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  }[size];

  return (
    <Loader2
      className={cn("spinner text-[var(--color-brand-600)]", sizeClass, className)}
    />
  );
}

export function SpinnerAlt({ size = "md", className }: SpinnerProps) {
  const sizeClass = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  }[size];

  return (
    <Loader
      className={cn("spinner-sm text-[var(--color-brand-600)]", sizeClass, className)}
    />
  );
}

export function LoadingOverlay({
  isLoading,
  children,
}: {
  isLoading: boolean;
  children: React.ReactNode;
}) {
  if (!isLoading) return <>{children}</>;

  return (
    <div className="relative">
      <div className="opacity-50 pointer-events-none">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-sm rounded-lg">
        <Spinner size="lg" />
      </div>
    </div>
  );
}

export function LoadingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-ground)]">
      <div className="text-center">
        <Spinner size="lg" className="mx-auto mb-4" />
        <p className="text-sm text-[var(--color-muted)]">Loading...</p>
      </div>
    </div>
  );
}

export function LoadingSection({
  isLoading = false,
}: {
  isLoading?: boolean;
}) {
  if (!isLoading) return null;

  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <Spinner size="md" className="mx-auto mb-2" />
        <p className="text-xs text-[var(--color-muted)]">Loading content...</p>
      </div>
    </div>
  );
}

export function LoadingPulse({
  text = "Processing",
}: {
  text?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full bg-[var(--color-brand-600)] pulse" />
      <span className="text-sm text-[var(--color-ink-muted)]">{text}...</span>
    </div>
  );
}

export function LoadingState({
  isLoading,
  message = "Loading...",
  children,
}: {
  isLoading: boolean;
  message?: string;
  children: React.ReactNode;
}) {
  if (!isLoading) return <>{children}</>;

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <Spinner size="md" />
      <p className="text-sm text-[var(--color-muted)]">{message}</p>
    </div>
  );
}

export function LoadingButton({
  isLoading = false,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { isLoading?: boolean }) {
  return (
    <button
      disabled={isLoading}
      className={cn(
        props.className,
        isLoading && "opacity-75 cursor-not-allowed"
      )}
      {...props}
    >
      {isLoading ? (
        <>
          <Spinner size="sm" className="mr-2 inline-block" />
          {children}
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function LoadingDots() {
  return (
    <div className="flex gap-1.5 items-center">
      <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" style={{ animationDelay: "0.2s" }} />
      <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" style={{ animationDelay: "0.4s" }} />
    </div>
  );
}
