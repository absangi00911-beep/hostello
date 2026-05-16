// Path: src/app/owner/settings/page.tsx
//
// Owner settings lives inside the OwnerLayout (fixed sidebar).
// It reuses the same form sections as the student profile page —
// personal info, security, and danger zone are identical for both roles.
// The OwnerLayout wrapper is applied automatically by src/app/owner/layout.tsx.

"use client";

import { useState, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Loader2,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  Upload,
} from "lucide-react";
import { inputCls } from "@/components/auth/AuthCardLayout";

/* ── Section wrapper ─────────────────────────────────────── */
function Section({
  id, title, description, children, danger = false,
}: {
  id: string; title: string; description?: string;
  children: React.ReactNode; danger?: boolean;
}) {
  return (
    <section
      id={id}
      className={`rounded-[var(--radius-lg)] border p-6 scroll-mt-8 ${
        danger
          ? "border-[oklch(0.52_0.18_22_/_0.3)] bg-[var(--color-error-bg)]"
          : "border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]"
      }`}
    >
      <div className="mb-5">
        <h2
          className={`text-[var(--text-h5)] font-[600] ${danger ? "text-[var(--color-error)]" : "text-[var(--color-text-heading)]"}`}
          style={{ fontFamily: "var(--font-body)" }}
        >
          {title}
        </h2>
        {description && (
          <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)] mt-0.5">
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

function SaveBtn({ loading, label = "Save changes" }: { loading: boolean; label?: string }) {
  return (
    <button type="submit" disabled={loading}
      className="inline-flex items-center gap-2 h-9 px-4 rounded-[var(--radius-md)] bg-[var(--color-action)] text-[var(--text-body-sm)] font-[500] text-white hover:bg-[var(--color-action-dark)] active:scale-[0.97] transition-all duration-[var(--transition-base)] disabled:opacity-50">
      {loading && <Loader2 size={14} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />}
      {loading ? "Saving…" : label}
    </button>
  );
}

/* ── Personal info ───────────────────────────────────────── */
function PersonalInfo({ profile }: { profile: any }) {
  const { update } = useSession();
  const [name, setName] = useState(profile?.name ?? "");
  const [bio,  setBio]  = useState(profile?.bio ?? "");
  const [city, setCity] = useState(profile?.city ?? "");
  const [avatar, setAvatar] = useState(profile?.avatar ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadAvatar(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res  = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Upload failed."); return; }
      setAvatar(json.url);
      toast.success("Photo ready — save changes to apply.");
    } catch { toast.error("Upload failed."); }
    finally { setUploading(false); }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res  = await fetch("/api/profile", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), bio: bio.trim() || undefined, city: city || undefined, avatar: avatar || undefined }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Update failed."); return; }
      await update({ name: name.trim() });
      toast.success("Profile updated.");
    } catch { toast.error("Something went wrong."); }
    finally { setSaving(false); }
  }

  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <form onSubmit={handleSave} className="space-y-4 max-w-[480px]">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
          className="relative h-14 w-14 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center overflow-hidden cursor-pointer shrink-0 hover:opacity-80 transition-opacity">
          {avatar
            ? <img src={avatar} alt="Avatar" className="h-full w-full object-cover" />
            : <span className="text-[var(--color-primary-deep)] text-lg font-[600] select-none">{initials || "?"}</span>}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <Loader2 size={16} strokeWidth={1.5} className="text-white animate-spin" aria-hidden="true" />
            </div>
          )}
        </button>
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
          className="text-[var(--text-body-sm)] text-[var(--color-text-link)] hover:underline disabled:opacity-50">
          {uploading ? "Uploading…" : "Change photo"}
        </button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only"
          onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="os-name" className="block text-[var(--text-label)] font-[500] text-[var(--color-text-body)]">Full name</label>
        <input id="os-name" type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
      </div>
      <div className="space-y-1.5">
        <label className="block text-[var(--text-label)] font-[500] text-[var(--color-text-body)]">Email</label>
        <div className="flex items-center gap-2">
          <input type="email" value={profile?.email ?? ""} readOnly className={`${inputCls} opacity-60 cursor-not-allowed`} />
          {profile?.emailVerified && <ShieldCheck size={16} strokeWidth={1.5} className="text-[var(--color-success)] shrink-0" />}
        </div>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="os-bio" className="block text-[var(--text-label)] font-[500] text-[var(--color-text-body)]">Bio <span className="text-[var(--color-text-muted)] font-[400]">(optional)</span></label>
        <textarea id="os-bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
          placeholder="Describe yourself or your business" className={`${inputCls} h-auto resize-none py-2.5`} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="os-city" className="block text-[var(--text-label)] font-[500] text-[var(--color-text-body)]">City <span className="text-[var(--color-text-muted)] font-[400]">(optional)</span></label>
        <input id="os-city" type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Lahore" className={inputCls} />
      </div>
      <SaveBtn loading={saving} />
    </form>
  );
}

/* ── Change password ─────────────────────────────────────── */
function ChangePassword() {
  const [curr,   setCurr]   = useState("");
  const [newPw,  setNewPw]  = useState("");
  const [conf,   setConf]   = useState("");
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newPw.length < 8) { setError("New password must be at least 8 characters."); return; }
    if (newPw !== conf)   { setError("Passwords don't match."); return; }
    setSaving(true);
    try {
      const res  = await fetch("/api/profile/change-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: curr, newPassword: newPw }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Failed."); return; }
      toast.success("Password changed. All other sessions signed out.");
      setCurr(""); setNewPw(""); setConf("");
    } catch { setError("Something went wrong."); }
    finally { setSaving(false); }
  }

  const eye = (
    <button type="button" onClick={() => setShowPw((v) => !v)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-body)] transition-colors"
      aria-label={showPw ? "Hide" : "Show"}>
      {showPw ? <EyeOff size={15} strokeWidth={1.5} aria-hidden="true" /> : <Eye size={15} strokeWidth={1.5} aria-hidden="true" />}
    </button>
  );

  return (
    <form onSubmit={handleSave} className="space-y-4 max-w-[380px]">
      {error && <p role="alert" className="text-[var(--text-body-sm)] text-[var(--color-error)]">{error}</p>}
      {[
        { id: "cp-curr", label: "Current password", val: curr, set: setCurr, ac: "current-password" },
        { id: "cp-new",  label: "New password",     val: newPw, set: setNewPw, ac: "new-password" },
        { id: "cp-conf", label: "Confirm password", val: conf,  set: setConf,  ac: "new-password" },
      ].map(({ id, label, val, set, ac }) => (
        <div key={id} className="space-y-1.5">
          <label htmlFor={id} className="block text-[var(--text-label)] font-[500] text-[var(--color-text-body)]">{label}</label>
          <div className="relative">
            <input id={id} type={showPw ? "text" : "password"} value={val}
              onChange={(e) => set(e.target.value)} autoComplete={ac} required
              className={`${inputCls} pr-10`} />
            {eye}
          </div>
        </div>
      ))}
      <SaveBtn loading={saving} label="Change password" />
    </form>
  );
}

/* ── Danger zone ─────────────────────────────────────────── */
function DangerZone() {
  const router = useRouter();
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (input !== "DELETE") return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/delete-account", { method: "POST" });
      if (!res.ok) { const j = await res.json(); toast.error(j.error ?? "Delete failed."); return; }
      await signOut({ redirect: false });
      router.push("/");
    } catch { toast.error("Something went wrong."); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-4">
      <p className="text-[var(--text-body-sm)] text-[var(--color-error-text)] leading-relaxed">
        Permanently deletes your account, all your listings, bookings, reviews, and messages. This cannot be undone.
      </p>
      <div className="space-y-1.5">
        <label htmlFor="dz-confirm" className="block text-[var(--text-label)] font-[500] text-[var(--color-text-body)]">
          Type <strong>DELETE</strong> to confirm
        </label>
        <input id="dz-confirm" type="text" value={input} onChange={(e) => setInput(e.target.value)}
          placeholder="DELETE" autoComplete="off" spellCheck="false" className={inputCls} />
      </div>
      <button onClick={handleDelete} disabled={input !== "DELETE" || loading}
        className="inline-flex items-center gap-2 h-9 px-4 rounded-[var(--radius-md)] bg-[var(--color-error)] text-[var(--text-body-sm)] font-[500] text-white hover:bg-[oklch(0.44_0.17_22)] active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed">
        {loading && <Loader2 size={13} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />}
        Delete my account
      </button>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────── */
export default function OwnerSettingsPage() {
  const { data: session } = useSession();

  const { data: profileData } = useQuery<{ data: any }>({
    queryKey: ["profile"],
    queryFn:  async () => {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!session,
  });

  const profile = profileData?.data ?? session?.user;

  return (
    <div className="max-w-[600px] space-y-5">
      <Section id="personal" title="Personal info" description="Your public profile information.">
        <PersonalInfo profile={profile} />
      </Section>
      <Section id="security" title="Security" description="Change your password.">
        <ChangePassword />
      </Section>
      <Section id="danger" title="Danger zone" danger>
        <DangerZone />
      </Section>
    </div>
  );
}