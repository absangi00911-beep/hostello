// Path: src/components/owner/ListingFormWizard.tsx
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Upload,
  Loader2,
  Check,
} from "lucide-react";
import { CITIES, AMENITIES } from "@hostello/shared";
import { inputCls } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ListingLocationPicker } from "./ListingLocationPicker";
import { ListingLivePreview } from "./ListingLivePreview";
import { CANCELLATION_POLICIES, CANCELLATION_POLICY_DETAILS, type CancellationPolicy } from "@/lib/cancellation-policy";

/* -- Types ------------------------------------------------- */
export interface ListingFormData {
  name: string;
  description: string;
  city: string;
  area: string;
  address: string;
  gender: "MALE" | "FEMALE" | "MIXED";
  cancellationPolicy: CancellationPolicy | "";
  pricePerMonth: number | "";
  rooms: number | "";
  capacity: number | "";
  minStay: number | "";
  maxStay: number | "";
  latitude: number | "";
  longitude: number | "";
  amenities: string[];
  images: string[];
  coverImage: string;
  rules: string[];
}

const DEFAULT_FORM: ListingFormData = {
  name: "", description: "", city: "", area: "", address: "",
  gender: "MIXED",
  cancellationPolicy: "",
  pricePerMonth: "", rooms: "", capacity: "", minStay: 1, maxStay: "",
  latitude: "", longitude: "",
  amenities: [], images: [], coverImage: "", rules: [],
};

const AMENITY_PRESETS = AMENITIES.map((a) => a.label);

const RULE_PRESETS = [
  "No smoking indoors",
  "No overnight guests",
  "No loud music after 10pm",
  "Curfew after 11pm",
  "No outside visitors in rooms",
];

/* -- Step indicator ---------------------------------------- */
const STEPS = ["Basic info","Location","Amenities","Photos","Rules","Cancellation terms","Review"];

function StepProgress({ step }: { step: number }) {
  return (
    <ol className="owner-listing-stepper mb-8 flex items-start" aria-label="Listing steps">
      {STEPS.map((label, i) => {
        const stepNum = i + 1;
        const isComplete = stepNum < step;
        const isActive = stepNum === step;
        const isLast = i === STEPS.length - 1;
        return (
          <li key={label} className={`flex items-center ${isLast ? "" : "flex-1"}`}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                aria-current={isActive ? "step" : undefined}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-full)] text-[13px] font-[700] transition-colors duration-[var(--transition-base)] ${
                  isComplete
                    ? "bg-[var(--color-primary)] text-[color:var(--color-text-inverse)]"
                    : isActive
                    ? "bg-[var(--color-primary)] text-[color:var(--color-text-inverse)] ring-4 ring-[var(--color-primary-faint)]"
                    : "bg-[var(--color-bg-overlay)] text-[color:var(--color-text-muted)]"
                }`}
              >
                {isComplete ? <Check size={15} strokeWidth={2.5} aria-hidden="true" /> : stepNum}
              </div>
              <span
                className={`hidden text-center text-[length:var(--text-caption)] font-[500] sm:block ${
                  isActive ? "text-[color:var(--color-text-heading)]" : "text-[color:var(--color-text-muted)]"
                }`}
              >
                {label}
              </span>
            </div>
            {!isLast && (
              <div
                className={`mx-2 h-0.5 flex-1 rounded-[var(--radius-full)] transition-colors duration-[var(--transition-base)] ${
                  isComplete ? "bg-[var(--color-primary)]" : "bg-[var(--color-border-subtle)]"
                }`}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/* -- Tag input --------------------------------------------- */
function TagInput({
  label, values, onChange, placeholder, presets,
}: {
  label: string; values: string[]; onChange: (v: string[]) => void;
  placeholder?: string; presets?: string[];
}) {
  const [input, setInput] = useState("");
  function add(val: string) {
    const trimmed = val.trim();
    if (trimmed && !values.includes(trimmed)) onChange([...values, trimmed]);
    setInput("");
  }
  function remove(val: string) { onChange(values.filter((v) => v !== val)); }

  return (
    <div className="space-y-2">
      <label className="block text-[length:var(--text-label)] font-[500] text-[color:var(--color-text-body)]">{label}</label>
      {presets && (
        <div className="flex flex-wrap gap-1.5">
          {presets.map((p) => (
            <button
              key={p} type="button"
              onClick={() => values.includes(p) ? remove(p) : add(p)}
              className={`h-7 px-2.5 rounded-[var(--radius-full)] text-[length:var(--text-caption)] font-[500] border transition-colors duration-[var(--transition-fast)] ${
                values.includes(p)
                  ? "bg-[var(--color-primary-faint)] border-[var(--color-primary-light)] text-[color:var(--color-primary-deep)]"
                  : "bg-[var(--color-bg-sidebar)] border-[var(--color-border-subtle)] text-[color:var(--color-text-muted)] hover:border-[var(--color-border-strong)]"
              }`}
            >
              {values.includes(p) ? "✓ " : ""}{p}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text" value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(input); } }}
          placeholder={placeholder ?? "Type and press Enter"}
          className={inputCls}
        />
        <button
          type="button" onClick={() => add(input)}
          disabled={!input.trim()}
          className="h-10 px-3 rounded-[var(--radius-md)] bg-[var(--color-bg-sidebar)] border border-[var(--color-border-default)] text-[color:var(--color-text-muted)] hover:bg-[var(--color-bg-overlay)] transition-colors disabled:opacity-40"
        >
          <Plus size={16} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {values.map((v) => (
            <span key={v} className="inline-flex items-center gap-1.5 h-7 pl-3 pr-2 rounded-[var(--radius-full)] bg-[var(--color-bg-sidebar)] border border-[var(--color-border-subtle)] text-[length:var(--text-caption)] text-[color:var(--color-text-body)]">
              {v}
              <button type="button" onClick={() => remove(v)} aria-label={`Remove ${v}`}
                className="flex h-4 w-4 items-center justify-center rounded-[var(--radius-full)] hover:bg-[var(--color-border-default)] transition-colors">
                <X size={10} strokeWidth={2} aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* -- Photo uploader ---------------------------------------- */
function PhotoUploader({
  images, coverImage, onChange, onCoverChange, hostelId,
}: {
  images: string[]; coverImage: string;
  onChange: (imgs: string[]) => void;
  onCoverChange: (url: string) => void;
  hostelId?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList) {
    if (images.length + files.length > 15) {
      toast.error("Maximum 15 photos allowed.");
      return;
    }
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      if (!["image/jpeg","image/png","image/webp"].includes(file.type)) {
        toast.error(`${file.name} is not a supported format. Use JPEG, PNG, or WebP.`);
        continue;
      }
      if (file.size > 4 * 1024 * 1024) {
        toast.error(`${file.name} exceeds the 4MB limit.`);
        continue;
      }
      const fd = new FormData();
      fd.append("file", file);
      if (hostelId) fd.append("hostelId", hostelId);
      try {
        const res  = await fetch("/api/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (!res.ok) { toast.error(json.error ?? "Upload failed."); continue; }
        newUrls.push(json.url);
      } catch { toast.error("Upload failed. Check your connection."); }
    }
    if (newUrls.length) {
      const updated = [...images, ...newUrls];
      onChange(updated);
      if (!coverImage && updated.length) onCoverChange(updated[0]);
    }
    setUploading(false);
  }

  function removeImage(url: string) {
    const updated = images.filter((i) => i !== url);
    onChange(updated);
    if (coverImage === url) onCoverChange(updated[0] ?? "");
  }

  return (
    <div className="space-y-4">
      <label className="block text-[length:var(--text-label)] font-[500] text-[color:var(--color-text-body)]">
        Photos <span className="text-[color:var(--color-text-muted)] font-[400]">(max 15, 4MB each)</span>
      </label>

      {/* Upload zone */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading || images.length >= 15}
        className="flex w-full flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--color-border-default)] bg-[var(--color-bg-sidebar)] py-10 transition-colors duration-[var(--transition-fast)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-faint)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? (
          <Loader2 size={24} strokeWidth={1.5} className="animate-spin text-[color:var(--color-primary)]" aria-hidden="true" />
        ) : (
          <Upload size={24} strokeWidth={1.5} className="text-[color:var(--color-text-muted)]" aria-hidden="true" />
        )}
        <p className="text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)]">
          {uploading ? "Uploading…" : "Click to upload photos"}
        </p>
        <p className="text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">JPEG, PNG, WebP</p>
      </button>
      <input
        ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp"
        multiple className="sr-only"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />

      {/* Preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {images.map((url, i) => (
            <div key={url} className="group relative aspect-square overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-bg-overlay)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
              {/* Cover badge */}
              {url === coverImage && (
                <span className="absolute left-1 top-1 rounded-sm bg-[var(--color-primary)] px-1 text-[9px] font-[700] text-[color:var(--color-text-inverse)] leading-4">
                  Cover
                </span>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-[var(--transition-fast)] flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                {url !== coverImage && (
                  <button
                    type="button" onClick={() => onCoverChange(url)}
                    className="rounded bg-white/90 px-1.5 py-0.5 text-[9px] font-[600] text-[color:var(--color-text-heading)]"
                  >
                    Set cover
                  </button>
                )}
                <button
                  type="button" onClick={() => removeImage(url)}
                  aria-label="Remove photo"
                  className="flex h-6 w-6 items-center justify-center rounded-[var(--radius-full)] bg-white/90 text-[color:var(--color-error)]"
                >
                  <X size={12} strokeWidth={2} aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* -- Main wizard ------------------------------------------- */
interface ListingFormWizardProps {
  initialData?: Partial<ListingFormData>;
  hostelId?: string;  // present on edit
  mode: "create" | "edit";
}

export function ListingFormWizard({ initialData, hostelId, mode }: ListingFormWizardProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<ListingFormData>({ ...DEFAULT_FORM, ...initialData });
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof ListingFormData>(key: K, value: ListingFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function next() {
    if (step === 6 && !form.cancellationPolicy) {
      toast.error("Choose a cancellation policy before continuing.");
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length));
  }
  function back() { setStep((s) => Math.max(s - 1, 1)); }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const payload = {
        name:          form.name.trim(),
        description:   form.description.trim(),
        city:          form.city,
        area:          form.area || undefined,
        address:       form.address.trim(),
        gender:        form.gender,
        cancellationPolicy: form.cancellationPolicy,
        pricePerMonth: Number(form.pricePerMonth),
        rooms:         Number(form.rooms),
        capacity:      Number(form.capacity),
        minStay:       Number(form.minStay) || 1,
        maxStay:       form.maxStay ? Number(form.maxStay) : undefined,
        latitude:      form.latitude ? Number(form.latitude) : undefined,
        longitude:     form.longitude ? Number(form.longitude) : undefined,
        amenities:     form.amenities,
        images:        form.images,
        coverImage:    form.coverImage || form.images[0] || undefined,
        rules:         form.rules,
        status:        "PENDING_REVIEW" as const,
      };

      const url    = mode === "edit" ? `/api/hostels/${hostelId}` : "/api/hostels";
      const method = mode === "edit" ? "PATCH" : "POST";

      const res  = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok) {
        // Handle quota exceeded error
        if (json.code === "QUOTA_EXCEEDED") {
          toast.error("You've reached your listing limit.", {
            description: "The Free plan includes one listing. Manage your current listing from My listings.",
          });
          return;
        }
        toast.error(json.error ?? "Submission failed.");
        return;
      }

      if (mode === "create") {
        const createdSlug: string | undefined = json?.data?.slug ?? json?.slug ?? undefined;
        const params = new URLSearchParams();
        if (createdSlug) params.set("slug", createdSlug);
        if (form.name.trim()) params.set("name", form.name.trim());
        router.push(`/owner/listings/success${params.toString() ? `?${params.toString()}` : ""}`);
      } else {
        toast.success("Listing updated and submitted for review.");
        router.push("/owner/listings");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const sectionCls = "owner-listing-section space-y-5 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-6 sm:p-8";
  const headingCls = "owner-form-heading text-[length:var(--text-h4)] font-[600] text-[color:var(--color-text-heading)] mb-5";

  return (
    <div className="owner-listing-wizard mx-auto max-w-6xl">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)] sm:hidden">
          Step {step} of {STEPS.length} — <span className="font-[500] text-[color:var(--color-text-body)]">{STEPS[step - 1]}</span>
        </p>
        <div className="hidden sm:block" />
        <Link
          href="/owner/listings"
          className="inline-flex items-center gap-1.5 text-[length:var(--text-body-sm)] font-[500] text-[color:var(--color-text-muted)] transition-colors duration-[var(--transition-fast)] hover:text-[color:var(--color-text-body)]"
        >
          <X size={15} strokeWidth={2} aria-hidden="true" />
          Exit
        </Link>
      </div>

      <StepProgress step={step} />

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="max-w-[640px]">

      {/* -- Step 1: Basic info ----------------------- */}
      {step === 1 && (
        <div className={sectionCls}>
          <h2 className={headingCls}>Basic info</h2>

          <div className="space-y-1.5">
            <label htmlFor="name" className="block text-[length:var(--text-label)] font-[500] text-[color:var(--color-text-body)]">Hostel name</label>
            <input id="name" type="text" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Green Valley Boys Hostel" className={inputCls} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="description" className="block text-[length:var(--text-label)] font-[500] text-[color:var(--color-text-body)]">Description</label>
            <textarea id="description" value={form.description} onChange={(e) => update("description", e.target.value)} rows={4} placeholder="Describe your hostel's location, who it's for, what makes it a good choice for students…" className={`${inputCls} h-auto resize-none py-2.5`} />
          </div>

          <div className="owner-field-grid-2 grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="city" className="block text-[length:var(--text-label)] font-[500] text-[color:var(--color-text-body)]">City</label>
              <select id="city" value={form.city} onChange={(e) => update("city", e.target.value)} className={`${inputCls} appearance-none`}>
                <option value="">Select city</option>
                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="area" className="block text-[length:var(--text-label)] font-[500] text-[color:var(--color-text-body)]">Area <span className="text-[color:var(--color-text-muted)] font-[400]">(optional)</span></label>
              <input id="area" type="text" value={form.area} onChange={(e) => update("area", e.target.value)} placeholder="e.g. Gulberg" className={inputCls} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="address" className="block text-[length:var(--text-label)] font-[500] text-[color:var(--color-text-body)]">Full address</label>
            <input id="address" type="text" value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="Street address with landmark" className={inputCls} />
          </div>

          <div className="space-y-1.5">
            <p className="text-[length:var(--text-label)] font-[500] text-[color:var(--color-text-body)]">Gender type</p>
            <div className="flex gap-3" role="radiogroup">
              {(["MALE","FEMALE","MIXED"] as const).map((g) => (
                <label key={g} className={`flex flex-1 items-center justify-center gap-2 h-10 rounded-[var(--radius-md)] border-2 cursor-pointer transition-all duration-[var(--transition-fast)] text-[length:var(--text-body-sm)] font-[500] ${form.gender === g ? "border-[var(--color-action)] bg-[var(--color-action-light)] text-[color:var(--color-action-dark)]" : "border-[var(--color-border-default)] text-[color:var(--color-text-muted)] hover:border-[var(--color-border-strong)]"}`}>
                  <input type="radio" name="gender" value={g} checked={form.gender === g} onChange={() => update("gender", g)} className="sr-only" />
                  {g === "MALE" ? "Male only" : g === "FEMALE" ? "Female only" : "Mixed"}
                </label>
              ))}
            </div>
          </div>

          <div className="owner-field-grid-2 grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="price" className="block text-[length:var(--text-label)] font-[500] text-[color:var(--color-text-body)]">Price / month (PKR)</label>
              <input id="price" type="number" value={form.pricePerMonth} onChange={(e) => update("pricePerMonth", e.target.value === "" ? "" : Number(e.target.value))} placeholder="e.g. 8500" min={1000} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="rooms" className="block text-[length:var(--text-label)] font-[500] text-[color:var(--color-text-body)]">Number of rooms</label>
              <input id="rooms" type="number" value={form.rooms} onChange={(e) => update("rooms", e.target.value === "" ? "" : Number(e.target.value))} placeholder="e.g. 10" min={1} className={inputCls} />
            </div>
          </div>

          <div className="owner-field-grid-3 grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="capacity" className="block text-[length:var(--text-label)] font-[500] text-[color:var(--color-text-body)]">Total capacity</label>
              <input id="capacity" type="number" value={form.capacity} onChange={(e) => update("capacity", e.target.value === "" ? "" : Number(e.target.value))} placeholder="e.g. 30" min={1} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="minstay" className="block text-[length:var(--text-label)] font-[500] text-[color:var(--color-text-body)]">Min stay (mo)</label>
              <input id="minstay" type="number" value={form.minStay} onChange={(e) => update("minStay", e.target.value === "" ? "" : Number(e.target.value))} min={1} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="maxstay" className="block text-[length:var(--text-label)] font-[500] text-[color:var(--color-text-body)]">Max stay <span className="text-[color:var(--color-text-muted)] font-[400] text-[length:var(--text-caption)]">(opt)</span></label>
              <input id="maxstay" type="number" value={form.maxStay} onChange={(e) => update("maxStay", e.target.value === "" ? "" : Number(e.target.value))} min={1} className={inputCls} />
            </div>
          </div>
        </div>
      )}

      {/* -- Step 2: Location ------------------------- */}
      {step === 2 && (
        <div className={sectionCls}>
          <h2 className={headingCls}>Pin your location <span className="text-[color:var(--color-text-muted)] text-[length:var(--text-body-sm)] font-[400]">(optional)</span></h2>
          <p className="text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)] -mt-2">
            Pinning your hostel helps students judge the commute to their university before they book.
          </p>
          <ListingLocationPicker
            latitude={form.latitude}
            longitude={form.longitude}
            onChange={(lat, lng) => { update("latitude", lat); update("longitude", lng); }}
          />
          <details className="group">
            <summary className="flex list-none items-center gap-1 text-[length:var(--text-body-sm)] font-[500] text-[color:var(--color-text-muted)] transition-colors hover:text-[color:var(--color-text-body)] cursor-pointer">
              <ChevronRight size={14} strokeWidth={2} className="transition-transform duration-[var(--transition-fast)] group-open:rotate-90" aria-hidden="true" />
              Enter coordinates manually instead
            </summary>
            <div className="owner-field-grid-2 mt-3 grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="lat" className="block text-[length:var(--text-label)] font-[500] text-[color:var(--color-text-body)]">Latitude</label>
                <input id="lat" type="number" step="any" value={form.latitude} onChange={(e) => update("latitude", e.target.value === "" ? "" : Number(e.target.value))} placeholder="e.g. 31.5204" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="lng" className="block text-[length:var(--text-label)] font-[500] text-[color:var(--color-text-body)]">Longitude</label>
                <input id="lng" type="number" step="any" value={form.longitude} onChange={(e) => update("longitude", e.target.value === "" ? "" : Number(e.target.value))} placeholder="e.g. 74.3587" className={inputCls} />
              </div>
            </div>
          </details>
        </div>
      )}

      {/* -- Step 3: Amenities ------------------------ */}
      {step === 3 && (
        <div className={sectionCls}>
          <h2 className={headingCls}>Amenities</h2>
          <TagInput label="What does your hostel offer?" values={form.amenities} onChange={(v) => update("amenities", v)} placeholder="Type a custom amenity and press Enter" presets={AMENITY_PRESETS} />
        </div>
      )}

      {/* -- Step 4: Photos --------------------------- */}
      {step === 4 && (
        <div className={sectionCls}>
          <h2 className={headingCls}>Photos</h2>
          <p className="text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)] -mt-2">
            At least one photo is required before submitting for review. First photo or the one you mark as "Cover" appears in search results.
          </p>
          <PhotoUploader
            images={form.images}
            coverImage={form.coverImage}
            onChange={(imgs) => update("images", imgs)}
            onCoverChange={(url) => update("coverImage", url)}
            hostelId={hostelId}
          />
        </div>
      )}

      {/* -- Step 5: Rules ---------------------------- */}
      {step === 5 && (
        <div className={sectionCls}>
          <h2 className={headingCls}>House rules</h2>
          <TagInput label="Rules students must follow" values={form.rules} onChange={(v) => update("rules", v)} placeholder="Type a custom rule and press Enter" presets={RULE_PRESETS} />
        </div>
      )}

      {/* -- Step 6: Review & submit ------------------- */}
      {step === 6 && (
        <div className={sectionCls}>
          <h2 className={headingCls}>Choose cancellation terms</h2>
          <p className="-mt-2 text-[length:var(--text-body-sm)] leading-relaxed text-[color:var(--color-text-muted)]">
            Students see these terms before paying. The selected policy is saved with each booking, so later listing edits won&apos;t change an existing reservation.
          </p>
          <div className="space-y-3" role="radiogroup" aria-label="Cancellation policy">
            {CANCELLATION_POLICIES.map((policy) => {
              const details = CANCELLATION_POLICY_DETAILS[policy];
              const selected = form.cancellationPolicy === policy;
              return (
                <label key={policy} className={`block cursor-pointer rounded-[var(--radius-lg)] border-2 p-4 transition-colors ${selected ? "border-[var(--color-action)] bg-[var(--color-action-light)]" : "border-[var(--color-border-default)] bg-[var(--color-bg-card)] hover:border-[var(--color-border-strong)]"}`}>
                  <input
                    type="radio"
                    name="cancellationPolicy"
                    value={policy}
                    checked={selected}
                    onChange={() => update("cancellationPolicy", policy)}
                    className="sr-only"
                  />
                  <span className="font-[600] text-[color:var(--color-text-heading)]">{details.label}</span>
                  <span className="mt-2 block space-y-1 text-[length:var(--text-body-sm)] leading-relaxed text-[color:var(--color-text-muted)]">
                    <span className="block">{details.fullRefund}</span>
                    <span className="block">{details.partialRefund}</span>
                    <span className="block">{details.noRefund}</span>
                  </span>
                </label>
              );
            })}
          </div>
          <p className="text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">
            Approved refunds are initiated within 1 business day. Banks may take 3–10 business days to post them. Owner declines and requests unanswered for 24 hours receive a full refund.
          </p>
        </div>
      )}

      {/* -- Step 7: Review & submit ------------------- */}
      {step === 7 && (
        <div className={sectionCls}>
          <h2 className={headingCls}>Review and submit</h2>
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-sidebar)] divide-y divide-[var(--color-border-subtle)]">
            {[
              { label: "Name",       value: form.name || "—" },
              { label: "City",       value: form.city ? `${form.city}${form.area ? `, ${form.area}` : ""}` : "—" },
              { label: "Gender",     value: form.gender },
              { label: "Cancellations", value: form.cancellationPolicy ? CANCELLATION_POLICY_DETAILS[form.cancellationPolicy].label : "Choose a policy" },
              { label: "Price",      value: form.pricePerMonth ? `PKR ${Number(form.pricePerMonth).toLocaleString()}/mo` : "—" },
              { label: "Rooms",      value: form.rooms ? `${form.rooms} rooms, ${form.capacity} capacity` : "—" },
              { label: "Amenities",  value: form.amenities.length ? form.amenities.join(", ") : "None added" },
              { label: "Photos",     value: `${form.images.length} photo${form.images.length !== 1 ? "s" : ""}` },
              { label: "Rules",      value: form.rules.length ? `${form.rules.length} rule${form.rules.length !== 1 ? "s" : ""}` : "None added" },
            ].map(({ label, value }) => (
              <div key={label} className="flex gap-4 px-5 py-3">
                <span className="text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)] w-24 shrink-0">{label}</span>
                <span className="text-[length:var(--text-body-sm)] text-[color:var(--color-text-body)] flex-1 min-w-0 break-words">{value}</span>
              </div>
            ))}
          </div>

          {form.images.length === 0 && (
            <div className="rounded-[var(--radius-md)] bg-[var(--color-warning-bg)] border border-[var(--color-warning)]/25 px-4 py-3 text-[length:var(--text-body-sm)] text-[color:var(--color-warning-text)]">
              ⚠ Add at least one photo before submitting.
            </div>
          )}

          <p className="text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">
            After submitting, an admin will review your listing. You'll receive an email when it's approved.
          </p>
        </div>
      )}

      {/* -- Navigation buttons ----------------------- */}
      <div className="flex gap-3 mt-8 pt-6 border-t border-[var(--color-border-subtle)]">
        {step > 1 && (
          <Button type="button" variant="outline" onClick={back}>
            <ChevronLeft size={16} strokeWidth={1.5} aria-hidden="true" />
            Back
          </Button>
        )}
        <div className="flex-1" />
        {step < STEPS.length ? (
          <Button type="button" onClick={next}>
            Continue
            <ChevronRight size={16} strokeWidth={1.5} aria-hidden="true" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || form.images.length === 0}
            loading={submitting}
          >
            {mode === "create" ? "Submit for review" : "Save changes"}
          </Button>
        )}
      </div>
        </div>

        {/* Live preview — updates as the form fills in, hidden below lg since there's no room for it */}
        <div className="hidden lg:block">
          <ListingLivePreview
            form={form}
            ownerName={session?.user?.name ?? "You"}
            ownerAvatar={session?.user?.image}
          />
        </div>
      </div>
    </div>
  );
}
