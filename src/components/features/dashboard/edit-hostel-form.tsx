"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Save, Trash2, Check } from "lucide-react";
import { z } from "zod";
import { CITIES, AMENITIES } from "@/config/amenities";
import { cn } from "@/lib/utils";
import { ImageUploader } from "./image-uploader";

// ─── Schema (mirrors API updateSchema — all optional) ─────────────────────────
const editSchema = z.object({
  name:          z.string().min(3, "At least 3 characters").max(100),
  description:   z.string().min(50, "At least 50 characters").max(2000),
  city:          z.string().min(1, "Pick a city"),
  area:          z.string().optional(),
  address:       z.string().min(10, "Enter the full address"),
  pricePerMonth: z.number({ invalid_type_error: "Enter a price" }).min(1000).max(100000),
  rooms:         z.number({ invalid_type_error: "Enter room count" }).int().min(1),
  capacity:      z.number({ invalid_type_error: "Enter capacity" }).int().min(1),
  gender:        z.enum(["MALE", "FEMALE", "MIXED"]),
  minStay:       z.number().int().min(1),
  maxStay:       z.number().int().optional().nullable(),
  amenities:     z.array(z.string()).optional(),
  rules:         z.array(z.string()).optional(),
});
type EditInput = z.infer<typeof editSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────
interface HostelData {
  id: string; name: string; description: string;
  city: string; area: string | null; address: string;
  pricePerMonth: number; rooms: number; capacity: number;
  gender: "MALE" | "FEMALE" | "MIXED";
  minStay: number; maxStay: number | null;
  amenities: string[]; rules: string[];
  images: string[]; coverImage: string | null;
  status: string;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const INPUT =
  "w-full h-11 px-4 rounded-xl border border-[var(--color-border)] text-sm bg-[var(--color-surface)] text-[var(--color-ink)] placeholder:text-[var(--color-muted)] outline-none focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-500)]/20 transition-all";
const LABEL = "block text-sm font-semibold text-[var(--color-ink-soft)] mb-1.5";
const SECTION = "bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 space-y-5";
const SECTION_TITLE = "text-base font-extrabold text-[var(--color-ink)] mb-1";

export function EditHostelForm({ hostel }: { hostel: HostelData }) {
  const router = useRouter();
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [images,   setImages]   = useState<string[]>(hostel.images ?? []);
  const [showDelete, setShowDelete] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<EditInput>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name:          hostel.name,
      description:   hostel.description,
      city:          hostel.city,
      area:          hostel.area ?? "",
      address:       hostel.address,
      pricePerMonth: hostel.pricePerMonth,
      rooms:         hostel.rooms,
      capacity:      hostel.capacity,
      gender:        hostel.gender,
      minStay:       hostel.minStay,
      maxStay:       hostel.maxStay ?? undefined,
      amenities:     hostel.amenities,
      rules:         Array.isArray(hostel.rules) ? (hostel.rules as string[]) : [],
    },
  });

  const selectedGender    = watch("gender");
  const selectedAmenities = watch("amenities") ?? [];

  // ── Save ──────────────────────────────────────────────────────────────────
  async function onSubmit(data: EditInput) {
    setSaving(true);
    try {
      const res = await fetch(`/api/hostels/${hostel.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          images,
          coverImage: images[0] ?? hostel.coverImage ?? null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Update failed");
      toast.success("Listing updated.");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  // ── Delete (soft) ─────────────────────────────────────────────────────────
  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/hostels/${hostel.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Listing removed from browse.");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Couldn't remove the listing. Try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

      {/* ── Basic info ── */}
      <div className={SECTION}>
        <div>
          <p className={SECTION_TITLE}>Basic info</p>
          <p className="text-xs text-[var(--color-muted)]">Students see this first.</p>
        </div>

        <Field label="Hostel name" error={errors.name?.message} required>
          <input {...register("name")} className={INPUT} />
        </Field>

        <Field label="Description" error={errors.description?.message} required>
          <textarea
            {...register("description")}
            rows={5}
            className={`${INPUT} h-auto py-3 resize-none`}
          />
        </Field>
      </div>

      {/* ── Location ── */}
      <div className={SECTION}>
        <div>
          <p className={SECTION_TITLE}>Location</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="City" error={errors.city?.message} required>
            <select {...register("city")} className={`${INPUT} appearance-none cursor-pointer`}>
              <option value="">Select city</option>
              {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Neighbourhood">
            <input {...register("area")} placeholder="e.g. Gulberg III" className={INPUT} />
          </Field>
        </div>

        <Field label="Full address" error={errors.address?.message} required>
          <input {...register("address")} placeholder="House, street, area" className={INPUT} />
        </Field>
      </div>

      {/* ── Details ── */}
      <div className={SECTION}>
        <div>
          <p className={SECTION_TITLE}>Capacity & pricing</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Monthly rent (PKR)" error={errors.pricePerMonth?.message} required>
            <input
              {...register("pricePerMonth", { valueAsNumber: true })}
              type="number" min={1000} className={INPUT}
            />
          </Field>
          <Field label="Rooms" error={errors.rooms?.message} required>
            <input
              {...register("rooms", { valueAsNumber: true })}
              type="number" min={1} className={INPUT}
            />
          </Field>
          <Field label="Total beds" error={errors.capacity?.message} required>
            <input
              {...register("capacity", { valueAsNumber: true })}
              type="number" min={1} className={INPUT}
            />
          </Field>
          <Field label="Min. stay (months)" error={errors.minStay?.message} required>
            <input
              {...register("minStay", { valueAsNumber: true })}
              type="number" min={1} className={INPUT}
            />
          </Field>
        </div>

        <Field label="Who can stay?" error={errors.gender?.message} required>
          <div className="flex gap-2">
            {(["MALE", "FEMALE", "MIXED"] as const).map((g) => {
              const labels = { MALE: "Boys only", FEMALE: "Girls only", MIXED: "Mixed" };
              return (
                <label key={g} className="flex-1 cursor-pointer">
                  <input type="radio" {...register("gender")} value={g} className="sr-only" />
                  <div className={cn(
                    "py-2.5 rounded-xl border text-sm font-semibold text-center transition-colors",
                    selectedGender === g
                      ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white"
                      : "border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-ink-soft)]"
                  )}>
                    {labels[g]}
                  </div>
                </label>
              );
            })}
          </div>
        </Field>

        <Field label="House rules">
          <textarea
            rows={3}
            placeholder={"One rule per line:\nNo guests after 10pm\nNo smoking"}
            className={`${INPUT} h-auto py-3 resize-none`}
            {...register("rules", {
              setValueAs: (v: string) =>
                typeof v === "string"
                  ? v.split("\n").map((r) => r.trim()).filter(Boolean)
                  : v,
            })}
          />
        </Field>
      </div>

      {/* ── Amenities ── */}
      <div className={SECTION}>
        <div>
          <p className={SECTION_TITLE}>Amenities</p>
          <p className="text-xs text-[var(--color-muted)]">
            {selectedAmenities.length} selected
          </p>
        </div>

        <Controller
          name="amenities"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AMENITIES.map((a) => {
                const on = field.value?.includes(a.id);
                return (
                  <label key={a.id} className="cursor-pointer">
                    <input type="checkbox" className="sr-only"
                      checked={on}
                      onChange={() => {
                        const next = on
                          ? (field.value ?? []).filter((x: string) => x !== a.id)
                          : [...(field.value ?? []), a.id];
                        field.onChange(next);
                      }}
                    />
                    <div className={cn(
                      "flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm transition-colors",
                      on
                        ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white"
                        : "border-[var(--color-border)] text-[var(--color-ink-soft)] hover:border-[var(--color-ink-soft)]"
                    )}>
                      <span className="text-base">{a.emoji}</span>
                      <span className="font-medium flex-1">{a.label}</span>
                      {on && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        />
      </div>

      {/* ── Photos ── */}
      <div className={SECTION}>
        <div>
          <p className={SECTION_TITLE}>Photos</p>
          <p className="text-xs text-[var(--color-muted)]">
            First photo is the cover image. Drag to reorder.
          </p>
        </div>
        <ImageUploader images={images} onChange={setImages} />
      </div>

      {/* ── Actions ── */}
      <div className="flex items-center justify-between gap-4 pt-2 pb-8">

        {/* Delete */}
        {!showDelete ? (
          <button
            type="button"
            onClick={() => setShowDelete(true)}
            className="flex items-center gap-2 text-sm font-semibold text-[var(--color-muted)] hover:text-red-600 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Remove listing
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <p className="text-sm text-red-600 font-medium">Remove from browse?</p>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yes, remove"}
            </button>
            <button
              type="button"
              onClick={() => setShowDelete(false)}
              className="px-4 py-2 rounded-xl border border-[var(--color-border)] text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--color-ground)] transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Save */}
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-ink)] text-white text-sm font-bold hover:bg-[var(--color-ink-soft)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label, error, required, children,
}: {
  label: string; error?: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div>
      <label className={LABEL}>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}
