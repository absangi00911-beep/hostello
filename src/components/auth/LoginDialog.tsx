"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { X } from "lucide-react";
import Link from "next/link";

function getAuthErrorMessage(error?: string): string | null {
  if (!error) return null;
  if (error === "OAuthAccountNotLinked") {
    return "This email already has an account. Log in with your email and password.";
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
  verified,
}: {
  callbackUrl: string;
  error?: string;
  googleEnabled: boolean;
  verified: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState(
    getAuthErrorMessage(error),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleRedirecting, setIsGoogleRedirecting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
        redirectTo: callbackUrl,
      });

      if (result?.error || !result?.ok) {
        setErrorMessage(
          result?.error === "CredentialsSignin"
            ? "The email or password doesn't match. Check both and try again."
            : "We couldn't log you in just now. Please try again.",
        );
        return;
      }

      router.replace(callbackUrl);
      router.refresh();
    } catch {
      setErrorMessage("Sign-in is temporarily unavailable. Please try again.");
    } finally {
      setIsSubmitting(false);
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

  function handleOpenChange(open: boolean) {
    if (!open) router.replace("/");
  }

  return (
    <Dialog.Root open onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="login-dialog-overlay" />
        <Dialog.Content
          aria-describedby="login-dialog-description"
          className="login-dialog-content"
        >
          <Dialog.Close asChild>
            <Link
              aria-label="Close login dialog"
              className="login-dialog-close"
              href="/"
            >
              <X aria-hidden="true" size={18} />
            </Link>
          </Dialog.Close>

          <div className="login-dialog-brand" aria-hidden="true">
            H
          </div>
          <Dialog.Title className="login-dialog-title">
            Log in to HostelLo
          </Dialog.Title>
          <Dialog.Description
            className="login-dialog-description"
            id="login-dialog-description"
          >
            Use your HostelLo account to continue.
          </Dialog.Description>

          {verified && (
            <p className="login-dialog-feedback" role="status">
              Your email has been verified. Log in to continue.
            </p>
          )}
          {errorMessage && (
            <p className="login-dialog-feedback login-dialog-feedback-error" role="alert">
              {errorMessage}
            </p>
          )}

          <form className="login-dialog-form" onSubmit={handleSubmit}>
            <label className="login-dialog-field">
              <span>Email</span>
              <input
                autoComplete="email"
                autoFocus
                name="email"
                onChange={(event) => setEmail(event.currentTarget.value)}
                required
                type="email"
                value={email}
              />
            </label>
            <label className="login-dialog-field">
              <span>Password</span>
              <input
                autoComplete="current-password"
                name="password"
                onChange={(event) => setPassword(event.currentTarget.value)}
                required
                type="password"
                value={password}
              />
            </label>
            <button
              className="login-dialog-submit"
              disabled={isSubmitting || isGoogleRedirecting}
              type="submit"
            >
              {isSubmitting ? "Logging in…" : "Log in"}
            </button>
          </form>

          {googleEnabled && (
            <>
              <div className="login-dialog-divider" aria-hidden="true">
                <span />
                <span>or</span>
                <span />
              </div>
              <button
                className="login-dialog-google"
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
