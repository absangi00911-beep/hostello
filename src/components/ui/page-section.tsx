"use client";

import { cn } from "@/lib/utils";

export interface PageSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  delay?: number;
  children: React.ReactNode;
}

export function PageSection({
  delay = 0,
  children,
  className,
  ...props
}: PageSectionProps) {
  return (
    <div
      className={cn("animate-fade-in", className)}
      style={{
        animationDelay: `${delay * 0.1}s`,
        ...props.style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
