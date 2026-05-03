"use client";

import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FormErrorProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string;
  icon?: boolean;
}

export function FormError({
  message,
  icon = true,
  className,
  ...props
}: FormErrorProps) {
  if (!message) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200",
        className
      )}
      {...props}
    >
      {icon && (
        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
      )}
      <p className="text-sm font-medium text-red-700">{message}</p>
    </div>
  );
}

export interface FormSuccessProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string;
  icon?: boolean;
}

import { CheckCircle2 } from "lucide-react";

export function FormSuccess({
  message,
  icon = true,
  className,
  ...props
}: FormSuccessProps) {
  if (!message) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 p-3 rounded-lg bg-[var(--color-brand-50)] border border-[var(--color-brand-200)]",
        className
      )}
      {...props}
    >
      {icon && (
        <CheckCircle2 className="w-4 h-4 text-[var(--color-brand-600)] flex-shrink-0" />
      )}
      <p className="text-sm font-medium text-[var(--color-brand-700)]">
        {message}
      </p>
    </div>
  );
}
