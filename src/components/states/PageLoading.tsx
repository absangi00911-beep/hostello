import Image from "next/image";
import { siteCopy } from "@/lib/site-copy";

/** Centered brand loader shown while a route segment streams in. */
export function PageLoading() {
  return (
    <main
      id="main-content"
      aria-busy="true"
      className="mx-auto flex min-h-dvh w-[min(1120px,calc(100%-40px))] flex-col items-center justify-center py-10"
      role="status"
    >
      <div
        aria-hidden="true"
        className="mb-8 flex items-center gap-2.5"
      >
        <Image
          src="/logo.png"
          alt=""
          width={48}
          height={48}
          className="h-12 w-12 shrink-0 motion-safe:animate-pulse"
          priority
        />
        <span className="text-title font-[750] tracking-[-0.045em] text-brand [font-family:'Arial_Rounded_MT_Bold','Trebuchet_MS',var(--font-inter),sans-serif]">
          HostelLo
        </span>
      </div>
      <p className="m-0 text-label text-muted">{siteCopy.states.loading}</p>
    </main>
  );
}
