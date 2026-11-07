"use client";

import Image from "next/image";
import { LoginDialogTrigger } from "@/components/auth/LoginDialogTrigger";
import { ArrowLeft, Heart, Share2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, type UIEvent } from "react";
import type { HostelDetailPhoto } from "@/lib/hostel-gallery";

interface HostelDetailGalleryProps {
  slug: string;
  name: string;
  photos: HostelDetailPhoto[];
  initiallySaved: boolean;
}

function readMessage(value: unknown): string | null {
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

function getPhotoTileClasses(photoCount: number, index: number): string {
  if (photoCount === 1) return "col-span-full row-span-full";
  if (photoCount === 2 && index === 1) {
    return "col-start-2 col-span-2 row-start-1 row-span-2";
  }
  if (photoCount === 3 && index === 1) {
    return "col-start-2 col-span-2 row-start-1";
  }
  if (photoCount === 3 && index === 2) {
    return "col-start-2 col-span-2 row-start-2";
  }
  if (photoCount === 4 && index === 3) {
    return "col-start-2 col-span-2 row-start-2";
  }

  switch (index) {
    case 0:
      return "col-start-1 row-start-1 row-span-2";
    case 1:
      return "col-start-2 row-start-1";
    case 2:
      return "col-start-3 row-start-1";
    case 3:
      return "col-start-2 row-start-2";
    default:
      return "col-start-3 row-start-2";
  }
}

export function HostelDetailGallery({
  slug,
  name,
  photos,
  initiallySaved,
}: HostelDetailGalleryProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const mobileGalleryRef = useRef<HTMLDivElement>(null);
  const [isSaved, setIsSaved] = useState(initiallySaved);
  const [isSaving, setIsSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const mosaicPhotos = photos.slice(0, 5);
  const photoCount = Math.max(1, mosaicPhotos.length);

  async function shareListing() {
    setActionMessage("");

    try {
      if (navigator.share) {
        await navigator.share({ title: name, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setActionMessage("Link copied.");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setActionMessage("Could not share the listing. Please try again.");
    }
  }

  async function toggleSaved() {
    setIsSaving(true);
    setActionMessage("");

    try {
      const response = await fetch(`/api/hostels/${encodeURIComponent(slug)}/favorite`, {
        method: isSaved ? "DELETE" : "POST",
      });

      if (!response.ok) {
        const result: unknown = await response.json();
        setActionMessage(
          response.status === 401
            ? "Sign in to save this hostel."
            : readMessage(result) ?? "Could not update your saved hostels.",
        );
        return;
      }

      const result: unknown = await response.json();
      if (
        typeof result !== "object" ||
        result === null ||
        !("saved" in result) ||
        typeof result.saved !== "boolean"
      ) {
        setActionMessage("Could not confirm the saved-hostel update.");
        return;
      }

      setIsSaved(result.saved);
      setActionMessage(result.saved ? "Hostel saved." : "Hostel removed from saved.");
    } catch {
      setActionMessage("Could not update your saved hostels. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleMobileGalleryScroll(event: UIEvent<HTMLDivElement>) {
    const gallery = event.currentTarget;
    if (gallery.clientWidth === 0 || photos.length < 2) return;

    setActivePhotoIndex(
      Math.min(
        photos.length - 1,
        Math.round(gallery.scrollLeft / gallery.clientWidth),
      ),
    );
  }

  function goBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/");
  }

  return (
    <>
      <section
        aria-labelledby="hostel-detail-title"
        className="hostel-detail-intro relative mb-5 [@media(max-width:720px)]:mb-0"
      >
        <div className="hostel-detail-title-row flex items-center justify-between gap-5 [@media(max-width:720px)]:absolute [@media(max-width:720px)]:inset-x-0 [@media(max-width:720px)]:bottom-0 [@media(max-width:720px)]:z-10 [@media(max-width:720px)]:rounded-t-[24px] [@media(max-width:720px)]:bg-white [@media(max-width:720px)]:px-5 [@media(max-width:720px)]:pt-5 [@media(max-width:720px)]:pb-3">
          <h1
            className="m-0 min-w-0 max-w-full text-xl leading-[1.18] font-medium tracking-[-0.02em] [overflow-wrap:anywhere] [text-wrap:balance] [@media(max-width:720px)]:text-center [@media(max-width:720px)]:text-[1.65rem] [@media(max-width:720px)]:leading-[1.2] [@media(max-width:720px)]:font-semibold"
            id="hostel-detail-title"
          >
            {name}
          </h1>
          <div className="hostel-detail-actions flex shrink-0 items-center gap-4 [@media(max-width:720px)]:hidden">
            <button
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 border-0 bg-transparent px-[2px] py-1.5 text-[0.82rem] font-semibold text-ink underline underline-offset-[3px]"
              onClick={() => void shareListing()}
              type="button"
            >
              <Share2 aria-hidden="true" size={16} />
              <span>Share</span>
            </button>
            <button
              aria-pressed={isSaved}
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 border-0 bg-transparent px-[2px] py-1.5 text-[0.82rem] font-semibold text-ink underline underline-offset-[3px] aria-pressed:text-brand-dark disabled:cursor-wait disabled:opacity-[0.65]"
              disabled={isSaving}
              onClick={() => void toggleSaved()}
              type="button"
            >
              <Heart
                aria-hidden="true"
                fill={isSaved ? "currentColor" : "none"}
                size={16}
              />
              <span>{isSaved ? "Saved" : "Save"}</span>
            </button>
          </div>
        </div>
        <div
          className="hostel-detail-gallery relative mt-[14px] grid h-[min(38vw,432px)] grid-cols-[minmax(0,2fr)_repeat(2,minmax(0,1fr))] grid-rows-[repeat(2,minmax(0,1fr))] gap-[5px] overflow-hidden rounded-xl bg-surface-muted [@media(max-width:720px)]:hidden"
          data-photo-count={photoCount}
        >
          {mosaicPhotos.length > 0 ? (
            mosaicPhotos.map((photo, index) => (
              <div
                className={`hostel-detail-photo relative min-h-0 min-w-0 overflow-hidden bg-surface-muted ${getPhotoTileClasses(
                  photoCount,
                  index,
                )} ${
                  index === 0
                    ? "[@media(max-width:720px)]:col-start-1 [@media(max-width:720px)]:row-start-1"
                    : "[@media(max-width:720px)]:hidden"
                }`}
                key={`${photo.src}-${index}`}
              >
                <Image
                  alt={photo.alt}
                  className="object-cover"
                  fill
                  priority={index === 0}
                  sizes="(max-width: 720px) 100vw, (max-width: 1100px) 50vw, 34vw"
                  src={photo.src}
                />
              </div>
            ))
          ) : (
            <div
              aria-label="Photos are not available for this hostel yet."
              className="hostel-detail-photo-fallback col-span-full row-span-full grid place-items-center p-6 text-center text-[0.92rem] text-muted [@media(max-width:720px)]:col-start-1 [@media(max-width:720px)]:row-start-1"
              role="img"
            >
              Photos are not available for this hostel yet.
            </div>
          )}
          {photos.length > 0 && (
            <button
              className="hostel-detail-show-photos absolute right-[14px] bottom-[14px] z-[1] min-h-[34px] cursor-pointer rounded-md border border-ink bg-white px-3 text-[0.8125rem] font-semibold text-ink hover:bg-surface-muted motion-reduce:transition-none [@media(max-width:720px)]:right-3 [@media(max-width:720px)]:bottom-3 btn-secondary"
              onClick={() => dialogRef.current?.showModal()}
              type="button"
            >
              Show all {photos.length} photos
            </button>
          )}
        </div>
        <div
          aria-label="Mobile hostel photo gallery"
          className="hostel-detail-mobile-gallery relative hidden h-[45svh] snap-x snap-mandatory overflow-x-auto overscroll-x-contain bg-surface-muted [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [@media(max-width:720px)]:flex"
          onScroll={handleMobileGalleryScroll}
          ref={mobileGalleryRef}
          role="region"
          tabIndex={0}
        >
          {photos.length > 0 ? (
            photos.map((photo, index) => (
              <div
                aria-label={`Photo ${index + 1} of ${photos.length}`}
                className="relative h-full w-full shrink-0 snap-center bg-surface-muted"
                key={`${photo.src}-mobile-${index}`}
                role="group"
              >
                <Image
                  alt={photo.alt}
                  className="object-cover"
                  fill
                  priority={index === 0}
                  sizes="100vw"
                  src={photo.src}
                />
              </div>
            ))
          ) : (
            <div
              aria-label="Photos are not available for this hostel yet."
              className="grid h-full w-full shrink-0 place-items-center p-6 text-center text-[0.92rem] text-muted"
              role="img"
            >
              Photos are not available for this hostel yet.
            </div>
          )}
        </div>
        <div className="hostel-detail-mobile-actions absolute inset-x-4 top-[max(16px,env(safe-area-inset-top))] z-20 hidden items-center justify-between [@media(max-width:720px)]:flex">
          <button
            aria-label="Go back"
            className="grid size-11 cursor-pointer place-items-center rounded-full border border-white/40 bg-white/55 text-ink shadow-sm backdrop-blur-md"
            onClick={goBack}
            type="button"
          >
            <ArrowLeft aria-hidden="true" size={20} />
          </button>
          <div className="flex items-center gap-3">
            <button
              aria-label={`Share ${name}`}
              className="grid size-11 cursor-pointer place-items-center rounded-full border border-white/40 bg-white/55 text-ink shadow-sm backdrop-blur-md"
              onClick={() => void shareListing()}
              type="button"
            >
              <Share2 aria-hidden="true" size={18} />
            </button>
            <button
              aria-label={isSaved ? `Remove ${name} from saved hostels` : `Save ${name}`}
              aria-pressed={isSaved}
              className="grid size-11 cursor-pointer place-items-center rounded-full border border-white/40 bg-white/55 text-ink shadow-sm backdrop-blur-md disabled:cursor-wait disabled:opacity-[0.65]"
              disabled={isSaving}
              onClick={() => void toggleSaved()}
              type="button"
            >
              <Heart
                aria-hidden="true"
                fill={isSaved ? "currentColor" : "none"}
                size={19}
              />
            </button>
          </div>
        </div>
        {photos.length > 0 && (
          <button
            aria-label={`Show all ${photos.length} photos, photo ${activePhotoIndex + 1} of ${photos.length}`}
            className="hostel-detail-mobile-photo-count absolute right-4 bottom-[76px] z-[2] hidden min-h-11 cursor-pointer items-center rounded-md border border-white/30 bg-black/45 px-2.5 text-[0.8125rem] font-semibold text-white backdrop-blur-md [@media(max-width:720px)]:inline-flex"
            onClick={() => dialogRef.current?.showModal()}
            type="button"
          >
            {activePhotoIndex + 1} / {photos.length}
          </button>
        )}
        {actionMessage && (
          <p
            aria-live="polite"
            className="hostel-detail-action-message mt-[10px] mb-0 text-right text-[0.8125rem] text-muted [@media(max-width:720px)]:text-left"
            role="status"
          >
            {actionMessage}
            {actionMessage === "Sign in to save this hostel." && (
              <>
                {" "}
                <LoginDialogTrigger className="font-[650] text-brand-dark underline underline-offset-[3px]">
                  Sign in
                </LoginDialogTrigger>
              </>
            )}
          </p>
        )}
      </section>

      {photos.length > 0 && (
        <dialog
          aria-label={`Photos of ${name}`}
          className="hostel-detail-photo-dialog m-auto max-h-[min(90dvh,900px)] w-[min(960px,calc(100%-32px))] max-w-[960px] rounded-[14px] border-0 bg-white p-5 text-ink backdrop:bg-black/[0.58] [@media(max-width:720px)]:w-[calc(100%-20px)] [@media(max-width:720px)]:p-[14px]"
          ref={dialogRef}
        >
          <div className="hostel-detail-dialog-header mb-4 flex items-center justify-between gap-5">
            <h2 className="m-0 text-xl leading-[1.2] font-semibold tracking-[-0.009em]">
              {photos.length} photos
            </h2>
            <button
              aria-label="Close photos"
              className="grid size-11 cursor-pointer place-items-center rounded-full border border-line bg-white text-ink btn-secondary"
              onClick={() => dialogRef.current?.close()}
              type="button"
            >
              <X aria-hidden="true" size={20} />
            </button>
          </div>
          <div className="hostel-detail-dialog-photos grid max-h-[calc(90dvh-100px)] grid-cols-2 gap-3 overflow-auto [@media(max-width:720px)]:grid-cols-1">
            {photos.map((photo, index) => (
              <Image
                alt={photo.alt}
                className="h-auto w-full rounded-lg object-cover"
                height={720}
                key={`${photo.src}-all-${index}`}
                src={photo.src}
                width={960}
              />
            ))}
          </div>
        </dialog>
      )}
    </>
  );
}
