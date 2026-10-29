"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { X } from "lucide-react";

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
  googleEnabled,
  onClose,
  open = true,
  verified,
}: {
  callbackUrl: string;
  error?: string;
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
  const [step, setStep] = useState<"email" | "otp" | "name">("email");
  const [errorMessage, setErrorMessage] = useState(
    getAuthErrorMessage(error),
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleRedirecting, setIsGoogleRedirecting] = useState(false);

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
    setErrorMessage(null);
    setIsGoogleRedirecting(true);
    try {
      await signIn("google", { redirectTo: callbackUrl });
    } catch {
      setErrorMessage("Google sign-in is temporarily unavailable. Please try again.");
      setIsGoogleRedirecting(false);
    }
  }

  async function requestOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextEmail = email.trim();

    if (!nextEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      setErrorMessage("Enter a valid email address to continue.");
      return;
    }

    setErrorMessage(null);
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
      setErrorMessage("Enter the 6-digit code sent to your email.");
      return;
    }

    setErrorMessage(null);
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
      setErrorMessage("Enter a name between 2 and 80 characters.");
      return;
    }

    setErrorMessage(null);
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
    setErrorMessage(null);
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
        >
          <Dialog.Close asChild>
            <button
              aria-label="Close login dialog"
              className="absolute right-4 top-4 grid size-9 cursor-pointer place-items-center rounded-full bg-transparent text-ink hover:bg-surface-muted"
              type="button"
            >
              <X aria-hidden="true" size={18} />
            </button>
          </Dialog.Close>

          <div
            className="mx-auto mb-[13px] grid size-[38px] place-items-center rounded-full border-[1.5px] border-brand text-base font-bold tracking-[-0.04em] text-brand"
            aria-hidden="true"
          >
            H
          </div>
          <Dialog.Title className="m-0 text-center text-xl leading-[1.2] font-semibold tracking-[-0.009em]">
            {step === "email"
              ? "Log in to HostelLo"
              : step === "otp"
                ? "Verify your email"
                : "Create your account"}
          </Dialog.Title>

          <Dialog.Description
            className="mt-[7px] mb-[22px] text-center text-[0.9rem] text-muted"
            id="login-dialog-description"
          >
            {step === "email"
              ? "Enter your email to receive a one-time login code."
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
              className="mb-4 rounded-[14px] bg-surface-muted px-[13px] py-[11px] text-[0.875rem] leading-[1.45] text-[#c13515]"
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

          {step === "email" ? (
            <form className="grid gap-[14px]" noValidate onSubmit={requestOtp}>
              <label className="grid gap-[6px] text-[0.875rem] font-semibold text-ink">
                <span>Email</span>
                <input
                  autoComplete="email"
                  autoFocus
                  className="min-h-[50px] w-full rounded-[8px] border border-muted bg-white px-[13px] text-base text-ink focus-visible:border-brand! focus-visible:outline-brand!"
                  name="email"
                  onChange={(event) => setEmail(event.currentTarget.value)}
                  required
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
          ) : step === "otp" ? (
            <form className="grid gap-[14px]" onSubmit={verifyOtp}>
              <label className="grid gap-[6px] text-[0.875rem] font-semibold text-ink">
                <span>6-digit code</span>
                <input
                  autoComplete="one-time-code"
                  autoFocus
                  className="min-h-[50px] w-full rounded-[8px] border border-muted bg-white px-[13px] text-base text-ink focus-visible:border-brand! focus-visible:outline-brand!"
                  inputMode="numeric"
                  maxLength={6}
                  name="otp"
                  onChange={(event) =>
                    setOtpCode(
                      event.currentTarget.value.replace(/\D/g, "").slice(0, 6),
                    )
                  }
                  pattern="[0-9]*"
                  placeholder="123456"
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

              <div className="mt-1 flex justify-between gap-3">
                <button
                  className="inline-flex min-h-[18px] cursor-pointer items-center justify-center rounded-[8px] border-0 bg-transparent text-[0.8rem] font-semibold text-brand hover:underline disabled:cursor-wait disabled:opacity-70"
                  onClick={() => setStep("email")}
                  type="button"
                >
                  Use another email
                </button>
                <button
                  className="inline-flex min-h-[18px] cursor-pointer items-center justify-center rounded-[8px] border-0 bg-transparent text-[0.8rem] font-semibold text-brand hover:underline disabled:cursor-wait disabled:opacity-70"
                  onClick={handleResendCode}
                  disabled={isSubmitting || isGoogleRedirecting}
                  type="button"
                >
                  Resend code
                </button>
              </div>
            </form>
          ) : (
            <form className="grid gap-[14px]" onSubmit={createAccount}>
              <label className="grid gap-[6px] text-[0.875rem] font-semibold text-ink">
                <span>Name</span>
                <input
                  autoComplete="name"
                  autoFocus
                  className="min-h-[50px] w-full rounded-[8px] border border-muted bg-white px-[13px] text-base text-ink focus-visible:border-brand! focus-visible:outline-brand!"
                  maxLength={80}
                  minLength={2}
                  name="name"
                  onChange={(event) => setName(event.currentTarget.value)}
                  required
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
                className="inline-flex min-h-[50px] w-full cursor-pointer items-center justify-center rounded-[8px] border border-muted bg-white text-base font-[650] text-ink enabled:hover:bg-surface-muted disabled:cursor-wait disabled:opacity-70"
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
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
