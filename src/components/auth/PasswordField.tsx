"use client";

import { useId, useState, type ChangeEvent, type Ref } from "react";

/**
 * Password input with a show/hide control. Typing a new password twice on a phone keyboard
 * is the most common cause of failed signups, so people can check what they typed.
 */
export function PasswordField({
  autoComplete,
  autoFocus,
  describedBy,
  hint,
  inputClassName,
  inputRef,
  invalid,
  label,
  name,
  onChange,
  required,
  value,
}: {
  autoComplete: "current-password" | "new-password";
  autoFocus?: boolean;
  describedBy?: string;
  hint?: string;
  inputClassName: string;
  inputRef?: Ref<HTMLInputElement>;
  invalid?: boolean;
  label: string;
  name: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  value: string;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const [visible, setVisible] = useState(false);
  const describedByIds = [hint ? hintId : null, describedBy]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="grid gap-[6px]">
      <label className="text-label font-semibold text-ink" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <input
          aria-describedby={describedByIds || undefined}
          aria-invalid={invalid || undefined}
          autoCapitalize="none"
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          className={`${inputClassName} pr-[72px]`}
          id={id}
          name={name}
          onChange={onChange}
          ref={inputRef}
          required={required}
          spellCheck={false}
          type={visible ? "text" : "password"}
          value={value}
        />
        <button
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="absolute inset-y-0 right-0 inline-flex min-w-[64px] cursor-pointer items-center justify-center rounded-r-[8px] border-0 bg-transparent px-3 text-label font-semibold text-brand-dark hover:underline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand"
          onClick={() => setVisible((current) => !current)}
          type="button"
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      {hint ? (
        <p className="m-0 text-label font-normal text-muted" id={hintId}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
