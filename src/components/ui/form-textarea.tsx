"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { FORM_TEXTAREA } from "@/lib/form-constants";

export interface FormTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
  helperText?: string;
  required?: boolean;
  charLimit?: number;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  (
    {
      error,
      label,
      helperText,
      required,
      charLimit,
      className,
      disabled,
      value,
      ...props
    },
    ref
  ) => {
    const charCount = typeof value === "string" ? value.length : 0;

    return (
      <div className="space-y-2 w-full">
        {label && (
          <label className="block text-sm font-medium text-[var(--color-ink)]">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          disabled={disabled}
          value={value}
          className={cn(
            FORM_TEXTAREA,
            error && "border-red-500 focus:ring-red-500",
            disabled && "bg-[var(--color-ground)] cursor-not-allowed opacity-60",
            className
          )}
          {...props}
        />

        <div className="flex items-center justify-between">
          <div>
            {error && (
              <p className="text-xs text-red-500 font-medium">{error}</p>
            )}
            {helperText && !error && (
              <p className="text-xs text-[var(--color-ink-muted)]">{helperText}</p>
            )}
          </div>
          {charLimit && (
            <p
              className={cn(
                "text-xs font-medium",
                charCount > charLimit * 0.8
                  ? "text-orange-500"
                  : "text-[var(--color-ink-muted)]"
              )}
            >
              {charCount}/{charLimit}
            </p>
          )}
        </div>
      </div>
    );
  }
);

FormTextarea.displayName = "FormTextarea";
