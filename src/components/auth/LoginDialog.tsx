"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";
import { X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

function getResponseMessage(value: unknown): string | null {
  if (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "string"
  ) {
    return value.error;
  }
  return null;
}

function isVerificationGrant(value: unknown): value is { grant: string; needsName: boolean } {
  return (
    typeof value === "object" &&
    value !== null &&
    "grant" in value &&
    typeof value.grant === "string" &&
    "needsName" in value &&
    typeof value.needsName === "boolean"
  );
}

function getAuthErrorMessage(error?: string): string | null {
  if (!error) return null;
  if (error === "OAuthAccountNotLinked") {
    return "This email is already linked to an account. Enter it to receive a login code.";
  }
  if (error === "expired-token") {
    return "That verification link has expired. Request a new one to continue.";
  }
  if (error === "invalid-token") {
    return "That verification link is invalid. Request a new one to continue.";
  }
  if (error === "server-error") {
    return "We couldn't verify your email just now. Please try again.";
  }
  return "We couldn't log you in. Check your details and try again.";
}

export default function LoginDialog({
  callbackUrl,
  error,
  emailCodeEnabled,
  googleEnabled,
  onClose,
  open = true,
  verified,
}: {
  callbackUrl: string;
  error?: string;
  emailCodeEnabled: boolean;
  googleEnabled: boolean;
  onClose?: () => void;
  open?: boolean;
  verified: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [name, setName] = useState("");
  const [grant, setGrant] = useState("");
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const inputRefs = {
    email: emailInputRef,
    password: passwordInputRef,
    otp: otpInputRef,
    name: nameInputRef,
  };
  const [invalidField, setInvalidField] = useState<
    keyof typeof inputRefs | null
  >(null);
  const [step, setStep] = useState<"email" | "otp" | "name">("email");
  const [loginMethod, setLoginMethod] = useState<"otp" | "password">(
    "password",
  );
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState(
    getAuthErrorMessage(error),
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleRedirecting, setIsGoogleRedirecting] = useState(false);

  function clearValidationError() {
    setInvalidField(null);
    setErrorMessage(null);
  }

  function clearFieldError(field: keyof typeof inputRefs) {
    if (invalidField === field) clearValidationError();
  }

  function reportValidationError(
    field: keyof typeof inputRefs,
    message: string,
  ) {
    setInvalidField(field);
    setErrorMessage(message);
    inputRefs[field].current?.focus();
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      if (onClose) {
        onClose();
      } else {
        router.replace("/");
      }
    }
  }

  async function handleGoogleSignIn() {
    clearValidationError();
    setIsGoogleRedirecting(true);
    try {
      await signIn("google", { redirectTo: callbackUrl });
    } catch {
      setErrorMessage("Google sign-in is temporarily unavailable. Please try again.");
      setIsGoogleRedirecting(false);
    }
  }

  async function handlePasswordSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextEmail = email.trim();

    if (!nextEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      reportValidationError("email", "Enter a valid email address to continue.");
      return;
    }
    if (!password) {
      reportValidationError("password", "Enter your password to continue.");
      return;
    }

    clearValidationError();
    setStatusMessage(null);
    setIsSubmitting(true);

    try {
      const result = await signIn("credentials", {
        email: nextEmail,
        password,
        redirect: false,
        redirectTo: callbackUrl,
      });

      if (result?.error || !result?.ok) {
        setErrorMessage("Email or password is incorrect.");
        return;
      }

      onClose?.();
      router.replace(callbackUrl);
      router.refresh();
    } catch {
      setErrorMessage("We couldn't log you in just now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function requestOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextEmail = email.trim();

    if (!nextEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      reportValidationError("email", "Enter a valid email address to continue.");
      return;
    }

    clearValidationError();
    setStatusMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/email-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: nextEmail }),
      });
      const result: unknown = await response.json();

      if (!response.ok) {
        setErrorMessage(
          getResponseMessage(result) ??
            "We couldn't send a code just now. Please try again.",
        );
        return;
      }

      setEmail(nextEmail.toLowerCase());
      setStep("otp");
      setOtpCode("");
      setStatusMessage(
        "If this email can receive sign-in codes, a code has been sent.",
      );
    } catch {
      setErrorMessage("We couldn't send a code just now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function completeLogin(verificationGrant: string, displayName?: string) {
    const result = await signIn("email-otp", {
      email,
      grant: verificationGrant,
      ...(displayName ? { name: displayName.trim() } : {}),
      redirect: false,
      redirectTo: callbackUrl,
    });

    if (result?.error || !result?.ok) {
      setErrorMessage(
        "That code could not be used. Request a new code and try again.",
      );
      return;
    }

    onClose?.();
    router.replace(callbackUrl);
    router.refresh();
  }

  async function verifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleaned = otpCode.replace(/\D/g, "").slice(0, 6);

    if (cleaned.length !== 6) {
      reportValidationError("otp", "Enter the 6-digit code sent to your email.");
      return;
    }

    clearValidationError();
    setStatusMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/email-otp/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, code: cleaned }),
      });
      const result: unknown = await response.json();

      if (!response.ok) {
        setErrorMessage(
          getResponseMessage(result) ??
            "That code is invalid or has expired. Request a new one.",
        );
        return;
      }

      if (!isVerificationGrant(result)) {
        setErrorMessage("We couldn't verify your email just now. Please try again.");
        return;
      }

      setGrant(result.grant);
      if (result.needsName) {
        setStep("name");
        return;
      }

      await completeLogin(result.grant);
    } catch {
      setErrorMessage("We couldn't verify your email just now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const displayName = name.trim();
    if (displayName.length < 2 || displayName.length > 80) {
      reportValidationError("name", "Enter a name between 2 and 80 characters.");
      return;
    }

    clearValidationError();
    setIsSubmitting(true);
    try {
      await completeLogin(grant, displayName);
    } catch {
      setErrorMessage("We couldn't create your account just now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendCode() {
    clearValidationError();
    setStatusMessage(null);
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/email-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        setErrorMessage(
          getResponseMessage(result) ??
            "We couldn't resend the code just now. Please try again.",
        );
        return;
      }
      setOtpCode("");
      setStatusMessage("If this email can receive sign-in codes, a new code has been sent.");
    } catch {
      setErrorMessage("We couldn't resend the code just now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[1000] bg-ink/[0.42]" />
        <Dialog.Content
          aria-describedby="login-dialog-description"
          className="fixed left-1/2 top-1/2 z-[1001] h-fit w-[min(calc(100vw_-_32px),440px)] max-h-[calc(100svh_-_48px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[20px] bg-white px-8 pt-[34px] pb-[30px] text-ink shadow-[0_20px_60px_rgb(0_0_0_/_22%)] outline-none! [@media(max-width:480px)]:max-h-[calc(100svh_-_24px)] [@media(max-width:480px)]:px-[22px] [@media(max-width:480px)]:pt-[30px] [@media(max-width:480px)]:pb-6 [@media(max-height:520px)]:top-[12px] [@media(max-height:520px)]:bottom-[12px] [@media(max-height:520px)]:my-auto [@media(max-height:520px)]:max-h-[calc(100svh_-_24px)] [@media(max-height:520px)]:translate-y-0"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            emailInputRef.current?.focus();
          }}
        >
          <Dialog.Close asChild>
            <button
              aria-label="Close login dialog"
              className="absolute right-4 top-4 grid size-11 cursor-pointer place-items-center rounded-full bg-transparent text-ink hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
              type="button"
            >
              <X aria-hidden="true" size={18} />
            </button>
          </Dialog.Close>

          <Link
            aria-label="hostello home"
            className="mx-auto mb-[13px] flex w-fit justify-center"
            href="/"
          >
            <Image
              src="/logo.png"
              alt="Hostello logo"
              width={48}
              height={48}
              className="size-12"
            />
          </Link>
          <Dialog.Title className="m-0 text-center text-xl leading-[1.2] font-semibold tracking-[-0.009em]">
            {step === "email"
              ? "Login or Signup"
              : step === "otp"
                ? "Verify your email"
                : "Create your account"}
          </Dialog.Title>

          <Dialog.Description
            className="mt-[7px] mb-[22px] text-center text-[0.9rem] text-muted"
            id="login-dialog-description"
          >
            {step === "email"
              ? loginMethod === "otp"
                ? "Enter your email to receive a one-time login code."
                : "Log in using the password for your account."
              : step === "otp"
                ? `Enter the 6-digit code sent to ${email || "your email"}.`
                : "Choose the name people will see on your HostelLo profile."}
          </Dialog.Description>

          {verified && (
            <p
              className="mb-4 rounded-[14px] bg-brand-soft px-[13px] py-[11px] text-[0.875rem] leading-[1.45] text-brand-dark"
              role="status"
            >
              Your email has been verified. Log in to continue.
            </p>
          )}
          {errorMessage && (
            <p
              id="login-dialog-error"
              className="mb-4 rounded-[14px] bg-surface-muted px-[13px] py-[11px] text-[0.875rem] leading-[1.45] text-danger"
              role="alert"
            >
              {errorMessage}
            </p>
          )}
          {statusMessage && (
            <p
              className="mb-4 rounded-[14px] bg-brand-soft px-[13px] py-[11px] text-[0.875rem] leading-[1.45] text-brand-dark"
              role="status"
            >
              {statusMessage}
            </p>
          )}

          {step === "email" && loginMethod === "otp" ? (
            <form className="grid gap-[14px]" noValidate onSubmit={requestOtp}>
              <label className="grid gap-[6px] text-[0.875rem] font-semibold text-ink">
                <span>Email</span>
                <input
                  aria-describedby={
                    invalidField === "email" ? "login-dialog-error" : undefined
                  }
                  aria-invalid={invalidField === "email" || undefined}
                  autoComplete="email"
                  autoFocus
                  className="min-h-[50px] w-full rounded-[8px] border border-muted bg-white px-[13px] text-base text-ink focus-visible:border-brand! focus-visible:outline-brand!"
                  name="email"
                  onChange={(event) => {
                    setEmail(event.currentTarget.value);
                    clearFieldError("email");
                  }}
                  required
                  ref={emailInputRef}
                  type="email"
                  value={email}
                />
              </label>

              <button
                className="mt-[2px] inline-flex min-h-[50px] cursor-pointer items-center justify-center rounded-[8px] border-0 bg-brand text-base font-[650] text-white enabled:hover:bg-brand-dark disabled:cursor-wait disabled:opacity-70"
                disabled={isSubmitting || isGoogleRedirecting}
                type="submit"
              >
                {isSubmitting ? "Sending code…" : "Continue"}
              </button>
            </form>
          ) : step === "email" ? (
            <form className="grid gap-[14px]" noValidate onSubmit={handlePasswordSignIn}>
              <label className="grid gap-[6px] text-[0.875rem] font-semibold text-ink">
                <span>Email</span>
                <input
                  aria-describedby={
                    invalidField === "email" ? "login-dialog-error" : undefined
                  }
                  aria-invalid={invalidField === "email" || undefined}
                  autoComplete="email"
                  autoFocus
                  className="min-h-[50px] w-full rounded-[8px] border border-muted bg-white px-[13px] text-base text-ink focus-visible:border-brand! focus-visible:outline-brand!"
                  name="email"
                  onChange={(event) => {
                    setEmail(event.currentTarget.value);
                    clearFieldError("email");
                  }}
                  required
                  ref={emailInputRef}
                  type="email"
                  value={email}
                />
              </label>
              <label className="grid gap-[6px] text-[0.875rem] font-semibold text-ink">
                <span>Password</span>
                <input
                  aria-describedby={
                    invalidField === "password"
                      ? "login-dialog-error"
                      : undefined
                  }
                  aria-invalid={invalidField === "password" || undefined}
                  autoComplete="current-password"
                  className="min-h-[50px] w-full rounded-[8px] border border-muted bg-white px-[13px] text-base text-ink focus-visible:border-brand! focus-visible:outline-brand!"
                  name="password"
                  onChange={(event) => {
                    setPassword(event.currentTarget.value);
                    clearFieldError("password");
                  }}
                  required
                  ref={passwordInputRef}
                  type="password"
                  value={password}
                />
              </label>
              <Link
                className="inline-flex min-h-11 items-center justify-self-end rounded-[8px] px-2 text-[0.85rem] font-semibold text-brand hover:underline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
                href="/forgot-password"
              >
                Forgot password?
              </Link>
              <button
                className="mt-[2px] inline-flex min-h-[50px] cursor-pointer items-center justify-center rounded-[8px] border-0 bg-brand text-base font-[650] text-white enabled:hover:bg-brand-dark disabled:cursor-wait disabled:opacity-70"
                disabled={isSubmitting || isGoogleRedirecting}
                type="submit"
              >
                {isSubmitting ? "Logging in…" : "Log in"}
              </button>
              {emailCodeEnabled && (
                <button
                  className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-[8px] border-0 bg-transparent px-2 text-[0.85rem] font-semibold text-brand hover:underline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-70"
                  disabled={isSubmitting || isGoogleRedirecting}
                  onClick={() => {
                    setLoginMethod("otp");
                    setPassword("");
                    clearValidationError();
                    setStatusMessage(null);
                  }}
                  type="button"
                >
                  Use one-time code
                </button>
              )}
            </form>
          ) : step === "otp" ? (
            <form className="grid gap-[14px]" onSubmit={verifyOtp}>
              <label className="grid gap-[6px] text-[0.875rem] font-semibold text-ink">
                <span>6-digit code</span>
                <input
                  aria-describedby={
                    invalidField === "otp" ? "login-dialog-error" : undefined
                  }
                  aria-invalid={invalidField === "otp" || undefined}
                  autoComplete="one-time-code"
                  autoFocus
                  className="min-h-[50px] w-full rounded-[8px] border border-muted bg-white px-[13px] text-base text-ink focus-visible:border-brand! focus-visible:outline-brand!"
                  inputMode="numeric"
                  maxLength={6}
                  name="otp"
                  onChange={(event) => {
                    setOtpCode(
                      event.currentTarget.value.replace(/\D/g, "").slice(0, 6),
                    );
                    clearFieldError("otp");
                  }}
                  pattern="[0-9]*"
                  placeholder="123456"
                  ref={otpInputRef}
                  type="text"
                  value={otpCode}
                />
              </label>

              <button
                className="mt-[2px] inline-flex min-h-[50px] cursor-pointer items-center justify-center rounded-[8px] border-0 bg-brand text-base font-[650] text-white enabled:hover:bg-brand-dark disabled:cursor-wait disabled:opacity-70"
                disabled={isSubmitting || isGoogleRedirecting}
                type="submit"
              >
                {isSubmitting ? "Verifying…" : "Continue"}
              </button>

              <div className="mt-1 flex flex-wrap justify-between gap-3">
                <button
                  className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-[8px] border-0 bg-transparent px-2 text-[0.8rem] font-semibold text-brand hover:underline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-70"
                  onClick={() => setStep("email")}
                  type="button"
                >
                  Use another email
                </button>
                <button
                  className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-[8px] border-0 bg-transparent px-2 text-[0.8rem] font-semibold text-brand hover:underline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-70"
                  onClick={handleResendCode}
                  disabled={isSubmitting || isGoogleRedirecting}
                  type="button"
                >
                  Resend code
                </button>
                <button
                  className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-[8px] border-0 bg-transparent px-2 text-[0.8rem] font-semibold text-brand hover:underline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-70"
                  disabled={isSubmitting || isGoogleRedirecting}
                  onClick={() => {
                    setLoginMethod("password");
                    setStep("email");
                    setOtpCode("");
                    clearValidationError();
                    setStatusMessage(null);
                  }}
                  type="button"
                >
                  Use password
                </button>
              </div>
            </form>
          ) : (
            <form className="grid gap-[14px]" onSubmit={createAccount}>
              <label className="grid gap-[6px] text-[0.875rem] font-semibold text-ink">
                <span>Name</span>
                <input
                  aria-describedby={
                    invalidField === "name" ? "login-dialog-error" : undefined
                  }
                  aria-invalid={invalidField === "name" || undefined}
                  autoComplete="name"
                  autoFocus
                  className="min-h-[50px] w-full rounded-[8px] border border-muted bg-white px-[13px] text-base text-ink focus-visible:border-brand! focus-visible:outline-brand!"
                  maxLength={80}
                  minLength={2}
                  name="name"
                  onChange={(event) => {
                    setName(event.currentTarget.value);
                    clearFieldError("name");
                  }}
                  required
                  ref={nameInputRef}
                  type="text"
                  value={name}
                />
              </label>

              <button
                className="mt-[2px] inline-flex min-h-[50px] cursor-pointer items-center justify-center rounded-[8px] border-0 bg-brand text-base font-[650] text-white enabled:hover:bg-brand-dark disabled:cursor-wait disabled:opacity-70"
                disabled={isSubmitting || isGoogleRedirecting}
                type="submit"
              >
                {isSubmitting ? "Creating account…" : "Create account"}
              </button>
            </form>
          )}

          {googleEnabled && step === "email" && (
            <>
              <div
                className="my-[18px] grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-xs text-muted"
                aria-hidden="true"
              >
                <span className="h-px bg-line" />
                <span>or</span>
                <span className="h-px bg-line" />
              </div>
              <button
                className="inline-flex min-h-[50px] w-full cursor-pointer items-center justify-center rounded-[8px] border border-muted bg-white text-base font-[650] text-ink enabled:hover:bg-surface-muted disabled:cursor-wait disabled:opacity-70 btn-secondary"
                disabled={isSubmitting || isGoogleRedirecting}
                onClick={() => void handleGoogleSignIn()}
                type="button"
              >
                {isGoogleRedirecting
                  ? "Connecting to Google…"
                  : "Continue with Google"}
              </button>
            </>
          )}
          {step === "email" && (
            <p className="mt-4 mb-0 text-center text-[0.875rem] text-muted">
              New to HostelLo?{" "}
              <Link
                className="inline-flex min-h-11 items-center rounded-[8px] px-2 font-semibold text-brand hover:underline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
                href="/signup"
              >
                Create account
              </Link>
            </p>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
