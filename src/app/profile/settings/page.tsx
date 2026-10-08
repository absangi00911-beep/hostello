// Path: src/app/profile/settings/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Eye, EyeOff, Loader2, ShieldCheck,
  CheckCircle2, Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { inputCls } from "@/components/ui/input";
import { StudentVerificationCard } from "@/components/dashboard/StudentVerificationCard";

/* -- Section wrapper --------------------------------------- */
function Section({
  id, title, description, children,
}: {
  id: string; title: string; description?: string; children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-4 md:p-7"
      aria-labelledby={`${id}-heading`}
    >
      <div className="mb-6">
        <h2
          id={`${id}-heading`}
          className="text-[length:var(--text-h5)] font-[600] text-[color:var(--color-text-heading)]"

        >
          {title}
        </h2>
        {description && (
          <p className="text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)] mt-1">
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

/* -- Save button ------------------------------------------- */
function SaveButton({ loading, label = "Save changes" }: { loading: boolean; label?: string }) {
  return (
    <Button type="submit" loading={loading} disabled={loading}>
      {loading ? "Saving…" : label}
    </Button>
  );
}

/* -- 1. Personal Info section ------------------------------ */
function PersonalInfoSection({ profile }: { profile: any }) {
  const { update: updateSession } = useSession();
  const [name,   setName]   = useState(profile?.name ?? "");
  const [bio,    setBio]    = useState(profile?.bio ?? "");
  const [city,   setCity]   = useState(profile?.city ?? "");
  const [phone,  setPhone]  = useState(profile?.phone ?? "");
  const [avatar, setAvatar] = useState(profile?.avatar ?? "");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Phone OTP state
  const [otpStep,   setOtpStep]   = useState<"idle" | "sending" | "verify">("idle");
  const [otp,       setOtp]       = useState("");
  const [verifying, setVerifying] = useState(false);
  const savedPhone = profile?.phone ?? "";
  const phoneChanged = phone.trim() !== savedPhone;
  const phoneVerified = Boolean(profile?.phoneVerified && !phoneChanged);

  const [saving, setSaving] = useState(false);

  async function handleAvatarUpload(file: File) {
    if (!["image/jpeg","image/png","image/webp"].includes(file.type)) {
      toast.error("Use a JPEG, PNG, or WebP image."); return;
    }
    if (file.size > 4 * 1024 * 1024) { toast.error("Image must be under 4MB."); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res  = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Upload failed."); return; }
      setAvatar(json.url);
      toast.success("Photo updated. Save changes to apply.");
    } catch { toast.error("Upload failed."); }
    finally { setUploading(false); }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      // A new non-empty number is saved only after OTP verification. This
      // request can clear an existing number, but cannot set an unverified one.
      const phoneUpdate = phone.trim() === "" && savedPhone ? "" : undefined;
      const res  = await fetch("/api/profile", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: name.trim(), bio: bio.trim() || undefined, city: city || undefined, phone: phoneUpdate, avatar: avatar || undefined }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Update failed."); return; }
      await updateSession({ name: name.trim() });
      toast.success(
        phoneChanged && phone.trim()
          ? "Profile updated. Verify the new phone number to save it."
          : "Profile updated.",
      );
    } catch { toast.error("Something went wrong."); }
    finally { setSaving(false); }
  }

  async function sendOtp() {
    setOtpStep("sending");
    try {
      const res  = await fetch("/api/auth/phone/request-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body:   JSON.stringify({ phone }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Couldn't send OTP."); setOtpStep("idle"); return; }
      setOtpStep("verify");
      toast.success("Verification code sent.");
    } catch { toast.error("Something went wrong."); setOtpStep("idle"); }
  }

  async function verifyOtp() {
    setVerifying(true);
    try {
      const res  = await fetch("/api/auth/phone/verify-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body:   JSON.stringify({ phone, otp }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Invalid code."); return; }
      setOtpStep("idle");
      setOtp("");
      toast.success("Phone number verified!");
      window.location.reload(); // refresh session
    } catch { toast.error("Something went wrong."); }
    finally { setVerifying(false); }
  }

  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <form onSubmit={handleSave} className="space-y-5">
      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div
          className="relative h-16 w-16 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center overflow-hidden cursor-pointer shrink-0"
          onClick={() => fileRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Change profile photo"
          onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
        >
          {avatar ? (
            <img src={avatar} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[color:var(--color-primary-deep)] text-xl font-[600] select-none">{initials || "?"}</span>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors duration-[var(--transition-fast)]">
            {uploading ? (
              <Loader2 size={18} strokeWidth={1.5} className="text-white animate-spin" aria-hidden="true" />
            ) : (
              <Upload size={16} strokeWidth={1.5} className="text-white opacity-0 hover:opacity-100" aria-hidden="true" />
            )}
          </div>
        </div>
        <div>
          <Button
            type="button"
            variant="link"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="h-auto p-0 text-[length:var(--text-body-sm)] disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "Change photo"}
          </Button>
          <p className="text-[length:var(--text-caption)] text-[color:var(--color-text-muted)] mt-0.5">JPEG, PNG, WebP · 4MB max</p>
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only"
          onChange={(e) => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])} />
      </div>

      {/* Name */}
      <div className="space-y-1.5">
        <label htmlFor="prof-name" className="block text-[length:var(--text-label)] font-[500] text-[color:var(--color-text-body)]">Full name</label>
        <input id="prof-name" type="text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={inputCls} />
      </div>

      {/* Email — read-only */}
      <div className="space-y-1.5">
        <label className="block text-[length:var(--text-label)] font-[500] text-[color:var(--color-text-body)]">Email</label>
        <div className="flex items-center gap-2">
          <input type="email" value={profile?.email ?? ""} readOnly className={`${inputCls} opacity-60 cursor-not-allowed`} />
          {profile?.emailVerified && (
            <ShieldCheck size={16} strokeWidth={1.5} className="text-[color:var(--color-success)] shrink-0" aria-label="Email verified" />
          )}
        </div>
        <p className="text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">Email cannot be changed.</p>
      </div>

      {/* Phone + OTP flow */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="prof-phone" className="block text-[length:var(--text-label)] font-[500] text-[color:var(--color-text-body)]">
            Phone <span className="text-[color:var(--color-text-muted)] font-[400]">(optional)</span>
          </label>
          {phoneVerified ? (
            <span className="flex items-center gap-1 text-[length:var(--text-caption)] font-[500] text-[color:var(--color-success)]">
              <CheckCircle2 size={12} strokeWidth={1.5} aria-hidden="true" />
              Verified
            </span>
          ) : phone && otpStep === "idle" ? (
            <button type="button" onClick={sendOtp} className="text-[length:var(--text-caption)] text-[color:var(--color-text-link)] hover:underline focus-visible:outline-none">
              Verify
            </button>
          ) : null}
        </div>
        <input
          id="prof-phone" type="tel" value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="03XX-XXXXXXX" autoComplete="tel"
          className={inputCls}
        />

        {/* OTP send button */}
        {otpStep === "sending" && (
          <div className="flex items-center gap-2 text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)]">
            <Loader2 size={14} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />
            Sending code…
          </div>
        )}

        {/* OTP input */}
        {otpStep === "verify" && (
          <div className="flex items-center gap-2">
            <input
              type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="6-digit code" maxLength={6} inputMode="numeric"
              className={`${inputCls} flex-1 font-[var(--font-mono)] tracking-widest`}
              aria-label="Verification code"
            />
            <Button type="button" onClick={verifyOtp} disabled={otp.length < 6 || verifying} size="sm">
              {verifying ? "…" : "Verify"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => { setOtpStep("idle"); setOtp(""); }} className="text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-body)]">
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Bio */}
      <div className="space-y-1.5">
        <label htmlFor="prof-bio" className="block text-[length:var(--text-label)] font-[500] text-[color:var(--color-text-body)]">Bio <span className="text-[color:var(--color-text-muted)] font-[400]">(optional)</span></label>
        <textarea id="prof-bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="A short bio about yourself" className={`${inputCls} h-auto resize-none py-2.5`} />
      </div>

      {/* City */}
      <div className="space-y-1.5">
        <label htmlFor="prof-city" className="block text-[length:var(--text-label)] font-[500] text-[color:var(--color-text-body)]">City <span className="text-[color:var(--color-text-muted)] font-[400]">(optional)</span></label>
        <input id="prof-city" type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Lahore" className={inputCls} />
      </div>

      <SaveButton loading={saving} />
    </form>
  );
}

/* -- 2. Security section ----------------------------------- */
function SecuritySection() {
  const [current,  setCurrent]  = useState("");
  const [newPw,    setNewPw]    = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newPw.length < 8) { setError("New password must be at least 8 characters."); return; }
    if (newPw !== confirm) { setError("Passwords don't match."); return; }
    setSaving(true);
    try {
      const res  = await fetch("/api/profile/change-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body:   JSON.stringify({ currentPassword: current, newPassword: newPw }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Password change failed."); return; }
      toast.success("Password changed. All other sessions have been signed out.");
      setCurrent(""); setNewPw(""); setConfirm("");
    } catch { setError("Something went wrong."); }
    finally { setSaving(false); }
  }

  const eyeBtn = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => setShowPw((v) => !v)}
      className="absolute right-1 top-1/2 -translate-y-1/2 text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-body)]"
      aria-label={showPw ? "Hide password" : "Show password"}
    >
      {showPw ? <EyeOff size={16} strokeWidth={1.5} aria-hidden="true" /> : <Eye size={16} strokeWidth={1.5} aria-hidden="true" />}
    </Button>
  );

  return (
    <form onSubmit={handleSave} className="space-y-4 max-w-[400px]">
      {error && (
        <div role="alert" className="rounded-[var(--radius-md)] bg-[var(--color-error-bg)] border border-[oklch(0.52_0.18_22_/_0.2)] px-4 py-3 text-[length:var(--text-body-sm)] text-[color:var(--color-error-text)]">
          {error}
        </div>
      )}
      <div className="space-y-1.5">
        <label htmlFor="curr-pw" className="block text-[length:var(--text-label)] font-[500] text-[color:var(--color-text-body)]">Current password</label>
        <div className="relative"><input id="curr-pw" type={showPw ? "text" : "password"} value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required className={`${inputCls} pr-10`} />{eyeBtn}</div>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="new-pw" className="block text-[length:var(--text-label)] font-[500] text-[color:var(--color-text-body)]">New password</label>
        <div className="relative"><input id="new-pw" type={showPw ? "text" : "password"} value={newPw} onChange={(e) => setNewPw(e.target.value)} autoComplete="new-password" required minLength={8} className={`${inputCls} pr-10`} />{eyeBtn}</div>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="conf-pw" className="block text-[length:var(--text-label)] font-[500] text-[color:var(--color-text-body)]">Confirm new password</label>
        <div className="relative"><input id="conf-pw" type={showPw ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required className={`${inputCls} pr-10`} />{eyeBtn}</div>
      </div>
      <SaveButton loading={saving} label="Change password" />
    </form>
  );
}

/* -- Email preferences section ---------------------------- */
function EmailPreferencesSection({ enabled }: { enabled: boolean }) {
  const queryClient = useQueryClient();
  const [emailEnabled, setEmailEnabled] = useState(enabled);
  const [saving, setSaving] = useState(false);

  useEffect(() => setEmailEnabled(enabled), [enabled]);

  async function handleSave() {
    setSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailNotifications: emailEnabled }),
      });
      const result = await response.json();
      if (!response.ok) {
        toast.error(result.error ?? "Couldn't update email preferences.");
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Email preferences updated.");
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <label className="flex items-start gap-3 text-[length:var(--text-body-sm)] text-[color:var(--color-text-body)]">
        <input
          type="checkbox"
          checked={emailEnabled}
          onChange={(event) => setEmailEnabled(event.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[var(--color-primary)]"
        />
        <span>
          <span className="block font-[500]">Receive price alert emails</span>
          <span className="mt-0.5 block text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">
            Booking and account-critical messages are unaffected.
          </span>
        </span>
      </label>
      <Button type="button" onClick={handleSave} disabled={saving} loading={saving}>
        {saving ? "Saving…" : "Save email preferences"}
      </Button>
    </div>
  );
}

/* -- 3. Danger Zone section -------------------------------- */
function DangerZoneSection() {
  const router   = useRouter();
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const canDelete = input === "DELETE";

  async function handleDelete() {
    if (!canDelete) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/delete-account", { method: "POST" });
      if (!res.ok) { const j = await res.json(); toast.error(j.error ?? "Delete failed."); return; }
      await signOut({ redirect: false });
      router.push("/?deleted=1");
    } catch { toast.error("Something went wrong."); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[var(--radius-md)] bg-[var(--color-error-bg)] border border-[oklch(0.52_0.18_22_/_0.2)] px-4 py-3">
        <p className="text-[length:var(--text-body-sm)] text-[color:var(--color-error-text)] leading-relaxed">
          Deleting your account permanently removes all your data: bookings, reviews, saved hostels, messages, and price alerts. This cannot be undone.
        </p>
      </div>
      <div className="space-y-2">
        <label htmlFor="delete-confirm" className="block text-[length:var(--text-label)] font-[500] text-[color:var(--color-text-body)]">
          Type <strong>DELETE</strong> to confirm
        </label>
        <input
          id="delete-confirm" type="text" value={input} onChange={(e) => setInput(e.target.value)}
          placeholder="DELETE" autoComplete="off" spellCheck="false"
          className={inputCls}
        />
      </div>
      <Button variant="destructive" onClick={handleDelete} disabled={!canDelete || loading} loading={loading}>
        {loading ? "Deleting account…" : "Delete my account"}
      </Button>
    </div>
  );
}

/* -- Page --------------------------------------------------- */
export default function ProfileSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login?callbackUrl=/profile/settings");
  }, [status, router]);

  const { data: profileData, isError: profileError } = useQuery<{ data: any }>({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error("Failed to load profile");
      return res.json();
    },
    enabled: !!session,
  });

  const profile = profileData?.data ?? session?.user;

  if (status === "loading" || !session) {
    return (
      <PublicLayout noFooter>
        <div className="flex h-64 items-center justify-center">
          <Loader2 size={24} strokeWidth={1.5} className="animate-spin text-[color:var(--color-primary)]" aria-hidden="true" />
        </div>
      </PublicLayout>
    );
  }

  if (profileError) {
    return (
      <PublicLayout noFooter>
        <div className="mx-auto flex min-h-64 w-full max-w-[720px] items-center justify-center px-4 py-8">
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-error)]/20 bg-[var(--color-error-bg)] px-4 py-3 text-center">
            <p className="text-[length:var(--text-body-sm)] font-[600] text-[color:var(--color-error-text)]">
              We couldn&apos;t load your profile.
            </p>
            <p className="mt-1 text-[length:var(--text-caption)] text-[color:var(--color-error-text)]">
              Refresh the page to try again.
            </p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="mx-auto w-full max-w-[720px] px-4 py-8 md:py-12 pb-24 md:pb-12">
        {/* Page heading */}
        <div className="mb-8">
          <h1
            className="font-heading text-[length:var(--text-h2)] font-[700] text-[color:var(--color-text-heading)] tracking-[-0.02em]"

          >
            Settings
          </h1>
          <p className="text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)] mt-1">
            Manage your profile and account settings.
          </p>
        </div>

        <div className="space-y-6">
            <Section id="personal" title="Personal info" description="Your public-facing profile information.">
              <PersonalInfoSection profile={profile} />
            </Section>

            <Section
              id="verification"
              title="Student verification"
              description="Build trust with hostel owners by confirming your student status."
            >
              <StudentVerificationCard
                currentStatus={profile?.verificationStatus ?? "NONE"}
                embedded
              />
            </Section>

            <Section id="security" title="Security" description="Update your password. Changing it signs out all other sessions.">
              <SecuritySection />
            </Section>

            <Section id="email-preferences" title="Email preferences" description="Choose whether you receive optional price alerts.">
              <EmailPreferencesSection enabled={profile?.emailNotifications ?? true} />
            </Section>

            <Section id="danger" title="Danger zone">
              <DangerZoneSection />
            </Section>
        </div>
      </div>
    </PublicLayout>
  );
}
