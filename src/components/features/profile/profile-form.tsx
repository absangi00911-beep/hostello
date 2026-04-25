"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getInitials } from "@/lib/utils";
import { CITIES } from "@/config/amenities";
import { Loader2 } from "lucide-react";

const schema = z.object({
  name:  z.string().min(2, "Name must be at least 2 characters"),
  phone: z
    .string()
    .regex(/^(\+92|0)[0-9]{10}$/, "Enter a valid Pakistani number")
    .optional()
    .or(z.literal("")),
  bio:   z.string().max(500, "Keep the bio under 500 characters").optional(),
  city:  z.string().optional(),
});
type Input = z.infer<typeof schema>;

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: "New password must be different from current password",
  path: ["newPassword"],
});
type PasswordInput = z.infer<typeof passwordSchema>;

const INPUT =
  "w-full h-11 px-4 rounded-xl border border-[var(--color-border)] text-sm bg-[var(--color-surface)] text-[var(--color-ink)] placeholder:text-[var(--color-muted)] outline-none focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-500)]/20 transition-all";

interface ProfileFormProps {
  user: {
    id: string; name: string; email: string; phone: string | null;
    bio: string | null; city: string | null; avatar: string | null; role: string;
  };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const router  = useRouter();
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<Input>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:  user.name,
      phone: user.phone ?? "",
      bio:   user.bio ?? "",
      city:  user.city ?? "",
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors, isDirty: isPasswordDirty },
    reset: resetPasswordForm,
  } = useForm<PasswordInput>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: Input) {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Update failed");
      }
      toast.success("Profile updated.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function onPasswordSubmit(data: PasswordInput) {
    setChangingPassword(true);
    try {
      const res = await fetch("/api/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Password change failed");
      }
      toast.success("Password changed successfully. Signing you out...");
      resetPasswordForm();
      // Sign out and redirect to login
      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <div className="space-y-4">

      {/* Avatar card */}
      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-[var(--color-ink)] text-white flex items-center justify-center text-xl font-bold flex-shrink-0 overflow-hidden">
          {user.avatar ? (
            <Image
              src={user.avatar}
              alt={user.name}
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          ) : (
            getInitials(user.name)
          )}
        </div>
        <div>
          <p
            className="font-extrabold text-[var(--color-ink)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {user.name}
          </p>
          <p className="text-sm text-[var(--color-muted)]">{user.email}</p>
          <span className="mt-1.5 inline-block text-xs font-bold text-[var(--color-brand-700)] bg-[var(--color-brand-50)] border border-[var(--color-brand-100)] px-2.5 py-0.5 rounded-full capitalize">
            {user.role.toLowerCase()}
          </span>
        </div>
      </div>

      {/* Personal Information Form */}
      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6">
        <h2
          className="text-base font-extrabold text-[var(--color-ink)] mb-6"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Personal information
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full name" error={errors.name?.message} required>
              <input {...register("name")} autoComplete="name" className={INPUT} />
            </Field>
            <Field label="Email">
              <input
                value={user.email} disabled
                className={`${INPUT} opacity-40 cursor-not-allowed`}
                readOnly
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Phone" error={errors.phone?.message}>
              <input
                {...register("phone")}
                type="tel"
                placeholder="0300-1234567"
                autoComplete="tel"
                className={INPUT}
              />
            </Field>
            <Field label="City">
              <select {...register("city")} className={`${INPUT} appearance-none cursor-pointer`}>
                <option value="">Select city</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Bio" error={errors.bio?.message}>
            <textarea
              {...register("bio")}
              rows={3}
              placeholder="A short intro about yourself…"
              className={`${INPUT} h-auto py-3 resize-none`}
            />
          </Field>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving || !isDirty}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--color-ink)] text-white text-sm font-bold hover:bg-[var(--color-ink-soft)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password Form */}
      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6">
        <h2
          className="text-base font-extrabold text-[var(--color-ink)] mb-6"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Change password
        </h2>

        <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-5" noValidate>

          <Field label="Current password" error={passwordErrors.currentPassword?.message} required>
            <input
              {...registerPassword("currentPassword")}
              type="password"
              placeholder="Enter your current password"
              autoComplete="current-password"
              className={INPUT}
            />
          </Field>

          <Field label="New password" error={passwordErrors.newPassword?.message} required>
            <input
              {...registerPassword("newPassword")}
              type="password"
              placeholder="Enter a new password (8+ characters)"
              autoComplete="new-password"
              className={INPUT}
            />
          </Field>

          <Field label="Confirm new password" error={passwordErrors.confirmPassword?.message} required>
            <input
              {...registerPassword("confirmPassword")}
              type="password"
              placeholder="Confirm your new password"
              autoComplete="new-password"
              className={INPUT}
            />
          </Field>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={changingPassword || !isPasswordDirty}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--color-ink)] text-white text-sm font-bold hover:bg-[var(--color-ink-soft)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {changingPassword && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {changingPassword ? "Changing…" : "Change password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label, error, required, children,
}: {
  label: string; error?: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[var(--color-ink-soft)] mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}
