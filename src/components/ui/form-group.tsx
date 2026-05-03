"use client";

import { cn } from "@/lib/utils";

export interface FormGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  fullWidth?: boolean;
}

export function FormGroup({
  children,
  fullWidth = true,
  className,
  ...props
}: FormGroupProps) {
  return (
    <div className={cn(fullWidth && "w-full", className)} {...props}>
      {children}
    </div>
  );
}

export interface FormGridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: 1 | 2 | 3 | 4;
  gap?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export function FormGrid({
  columns = 1,
  gap = "md",
  children,
  className,
  ...props
}: FormGridProps) {
  const colsMap = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  const gapMap = {
    sm: "gap-3",
    md: "gap-5",
    lg: "gap-7",
  };

  return (
    <div
      className={cn("grid", colsMap[columns], gapMap[gap], className)}
      {...props}
    >
      {children}
    </div>
  );
}

export interface FormSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  children: React.ReactNode;
}

export function FormSection({
  title,
  description,
  children,
  className,
  ...props
}: FormSectionProps) {
  return (
    <div className={cn("space-y-4", className)} {...props}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h3 className="text-lg font-semibold text-[var(--color-ink)]">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-[var(--color-ink-muted)]">
              {description}
            </p>
          )}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  );
}
