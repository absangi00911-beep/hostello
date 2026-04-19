"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Upload, X, Loader2, ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { MAX_IMAGE_SIZE_MB, ACCEPTED_IMAGE_TYPES, MAX_IMAGES_PER_HOSTEL } from "@/config/constants";

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export function ImageUploader({
  images,
  onChange,
  maxImages = MAX_IMAGES_PER_HOSTEL,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [draggingOver, setDraggingOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadOne(file: File): Promise<string | null> {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error(`${file.name}: unsupported type. Use JPEG, PNG, or WebP.`);
      return null;
    }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      toast.error(`${file.name}: exceeds ${MAX_IMAGE_SIZE_MB} MB limit.`);
      return null;
    }
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Upload failed");
    return json.url as string;
  }

  async function handleFiles(files: FileList | File[]) {
    const fileArr = Array.from(files);
    const slots = maxImages - images.length;
    if (slots <= 0) {
      toast.error(`Maximum ${maxImages} photos allowed.`);
      return;
    }
    const batch = fileArr.slice(0, slots);
    setUploading(true);
    try {
      const results = await Promise.allSettled(batch.map(uploadOne));
      const urls = results
        .filter((r): r is PromiseFulfilledResult<string> =>
          r.status === "fulfilled" && r.value !== null
        )
        .map((r) => r.value);
      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed) toast.error(`${failed} photo${failed !== 1 ? "s" : ""} failed.`);
      if (urls.length) {
        onChange([...images, ...urls]);
        toast.success(`${urls.length} photo${urls.length !== 1 ? "s" : ""} added.`);
      }
    } catch {
      toast.error("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDraggingOver(false);
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault(); // prevent form submission on Enter
      inputRef.current?.click();
    }
  }

  function removeImage(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  function setCover(index: number) {
    onChange([images[index], ...images.filter((_, i) => i !== index)]);
    toast.success("Cover photo updated.");
  }

  const canAdd = images.length < maxImages;

  return (
    <div className="space-y-4">
      {/* Drop zone — only show when slots remain */}
      {canAdd && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={onKeyDown}
          onDragOver={(e) => { e.preventDefault(); setDraggingOver(true); }}
          onDragLeave={() => setDraggingOver(false)}
          onDrop={onDrop}
          className={cn(
            "flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-8 cursor-pointer transition-colors select-none",
            draggingOver
              ? "border-[var(--color-primary-700)] bg-[var(--color-primary-50)]"
              : "border-[var(--color-border)] hover:border-[var(--color-sand-400)] bg-[var(--color-sand-50)]"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(",")}
            multiple
            className="sr-only"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            disabled={uploading}
          />
          {uploading ? (
            <Loader2 className="w-8 h-8 text-[var(--color-primary-700)] animate-spin" />
          ) : (
            <Upload className="w-8 h-8 text-[var(--color-sand-400)]" />
          )}
          <div className="text-center">
            <p className="text-sm font-medium text-[var(--color-text)]">
              {uploading ? "Uploading…" : "Drop photos here or click to browse"}
            </p>
            <p className="text-xs text-[var(--color-muted)] mt-1">
              JPEG, PNG, WebP · max {MAX_IMAGE_SIZE_MB} MB ·{" "}
              {images.length}/{maxImages} uploaded
            </p>
          </div>
        </div>
      )}

      {/* Preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((url, i) => (
            <div
              key={`${url}-${i}`}
              className="relative group rounded-xl overflow-hidden aspect-[4/3] bg-[var(--color-sand-100)]"
            >
              <Image
                src={url}
                alt={`Photo ${i + 1}`}
                fill
                sizes="(max-width: 640px) 50vw, 33vw"
                className="object-cover"
              />

              {i === 0 && (
                <span className="absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-md bg-[var(--color-accent-500)] text-white pointer-events-none">
                  Cover
                </span>
              )}

              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {i !== 0 && (
                  <button
                    type="button"
                    onClick={() => setCover(i)}
                    className="px-2 py-1 rounded-lg bg-white/90 text-xs font-medium text-[var(--color-text)] hover:bg-white transition-colors"
                  >
                    Set cover
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="w-7 h-7 rounded-lg bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors"
                  aria-label={`Remove photo ${i + 1}`}
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>
          ))}

          {canAdd && (
            <label className="rounded-xl border-2 border-dashed border-[var(--color-border)] aspect-[4/3] flex flex-col items-center justify-center cursor-pointer hover:border-[var(--color-sand-400)] hover:bg-[var(--color-sand-50)] transition-colors">
              <input
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(",")}
                multiple
                className="sr-only"
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
                disabled={uploading}
              />
              <ImagePlus className="w-6 h-6 text-[var(--color-sand-400)]" />
              <span className="text-xs text-[var(--color-muted)] mt-1.5">Add more</span>
            </label>
          )}
        </div>
      )}
    </div>
  );
}
