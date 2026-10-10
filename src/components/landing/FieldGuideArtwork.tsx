"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { MapPin, ShieldCheck } from "lucide-react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { PhotoImage } from "@/components/landing/PhotoImage";
import { formatPKR } from "@/components/ui/shared";

interface FieldGuideArtworkProps {
  src: string;
  name: string;
  location: string;
  price?: number;
  verified?: boolean;
}

/** A real listing presented like a field-note photograph, with light pointer-led depth. */
export function FieldGuideArtwork({
  src,
  name,
  location,
  price,
  verified = false,
}: FieldGuideArtworkProps) {
  const pointerTiltX = useMotionValue(0);
  const pointerTiltY = useMotionValue(0);
  const rotateX = useSpring(pointerTiltX, { stiffness: 130, damping: 20, mass: 0.45 });
  const rotateY = useSpring(pointerTiltY, { stiffness: 130, damping: 20, mass: 0.45 });
  const imageX = useTransform(rotateY, [-5, 5], [7, -7]);
  const imageY = useTransform(rotateX, [-5, 5], [-6, 6]);

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    pointerTiltX.set((0.5 - y) * 8);
    pointerTiltY.set((x - 0.5) * 9);
  }

  function resetTilt() {
    pointerTiltX.set(0);
    pointerTiltY.set(0);
  }

  return (
    <div
      className="relative mx-auto aspect-[0.92] w-full max-w-[650px] [perspective:1200px]"
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
    >
      <div
        className="absolute right-[8%] top-[3%] aspect-square w-[38%] rounded-full border border-[var(--color-primary-light)] bg-[radial-gradient(circle_at_38%_35%,#f8dfbd_0%,#e8b78e_58%,#d99270_100%)] shadow-[0_20px_55px_rgba(173,75,57,0.12)]"
        aria-hidden="true"
      />

      <motion.svg
        className="absolute inset-0 z-[1] h-full w-full overflow-visible"
        viewBox="0 0 600 650"
        fill="none"
        aria-hidden="true"
        initial={{ opacity: 0, y: 14, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
      >
        <defs>
          <linearGradient id="hostello-wall-left" x1="150" y1="300" x2="300" y2="500" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fff8eb" />
            <stop offset="1" stopColor="#e8d7bf" />
          </linearGradient>
          <linearGradient id="hostello-wall-right" x1="300" y1="390" x2="460" y2="490" gradientUnits="userSpaceOnUse">
            <stop stopColor="#c77b5e" />
            <stop offset="1" stopColor="#8c493b" />
          </linearGradient>
          <linearGradient id="hostello-room-roof" x1="190" y1="220" x2="420" y2="355" gradientUnits="userSpaceOnUse">
            <stop stopColor="#e9ad81" />
            <stop offset="1" stopColor="#bd6249" />
          </linearGradient>
          <filter id="hostello-room-shadow" x="35" y="160" width="530" height="455" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation="12" />
          </filter>
        </defs>

        <ellipse cx="304" cy="506" rx="214" ry="58" fill="#60392e" opacity="0.14" filter="url(#hostello-room-shadow)" />
        <path d="m78 420 218-126 224 129-220 127L78 420Z" fill="#d7c3ab" />
        <path d="m119 420 178-103 183 106-180 104-181-107Z" fill="#e9ddcd" />

        <path d="m137 300 162 94v126l-162-94V300Z" fill="url(#hostello-wall-left)" />
        <path d="m299 394 162-94v126l-162 94V394Z" fill="url(#hostello-wall-right)" />
        <path d="m137 300 162-95 162 95-162 94-162-94Z" fill="url(#hostello-room-roof)" />
        <path d="m137 300 162 94 162-94" stroke="#653b30" strokeWidth="2" strokeOpacity="0.48" />
        <path d="m158 300 141-82 141 82" stroke="#fff1dd" strokeWidth="2" strokeOpacity="0.6" />

        {/* Sunlit windows on the two isometric walls */}
        <path d="m161 321 40 23v43l-40-23v-43Z" fill="#90a69a" stroke="#9a8069" strokeWidth="3" />
        <path d="m167 329 28 16v28l-28-16v-28Z" fill="#f4d08f" />
        <path d="m218 355 39 23v43l-39-23v-43Z" fill="#90a69a" stroke="#9a8069" strokeWidth="3" />
        <path d="m224 363 27 16v28l-27-16v-28Z" fill="#f4d08f" />
        <path d="m326 390 39-23v43l-39 23v-43Z" fill="#6e887c" stroke="#734538" strokeWidth="3" />
        <path d="m332 394 27-16v28l-27 16v-28Z" fill="#efbd77" />
        <path d="m394 351 39-23v43l-39 23v-43Z" fill="#6e887c" stroke="#734538" strokeWidth="3" />
        <path d="m400 355 27-16v28l-27 16v-28Z" fill="#efbd77" />

        {/* A small doorway and a planted doorstep give the model a lived-in scale. */}
        <path d="m252 414 37 21v67l-37-21v-67Z" fill="#633e34" />
        <path d="m259 420 24 14v53l-24-14v-53Z" fill="#dfad7d" />
        <path d="m112 462 21-12 20 12v34l-20 12-21-12v-34Z" fill="#567363" />
        <path d="m121 459 12-22 13 22M130 456l-7-29M136 455l12-25" stroke="#567363" strokeWidth="4" strokeLinecap="round" />
        <path d="m448 462 16-9 16 9v27l-16 9-16-9v-27Z" fill="#567363" />
        <path d="m454 459 10-19 10 19M462 457l-5-25M467 456l9-20" stroke="#567363" strokeWidth="3.5" strokeLinecap="round" />
        <path d="m192 481 105 61 109-63" stroke="#fff8eb" strokeWidth="2" strokeOpacity="0.72" />
      </motion.svg>

      <svg
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible text-[color:var(--color-primary-deep)]"
        viewBox="0 0 600 650"
        fill="none"
        aria-hidden="true"
      >
        <g stroke="currentColor" strokeWidth="1" opacity="0.12">
          <path d="M-30 166C77 107 159 120 231 160s134 47 225-4 125-34 181-8" />
          <path d="M-30 183C77 124 159 137 231 177s134 47 225-4 125-34 181-8" />
          <path d="M-30 200C77 141 159 154 231 194s134 47 225-4 125-34 181-8" />
          <path d="M-30 217C77 158 159 171 231 211s134 47 225-4 125-34 181-8" />
          <path d="M-30 234C77 175 159 188 231 228s134 47 225-4 125-34 181-8" />
          <path d="M-12 510c86-45 138-42 202 1s113 44 171 9 102-47 191-23" />
          <path d="M-12 527c86-45 138-42 202 1s113 44 171 9 102-47 191-23" />
          <path d="M-12 544c86-45 138-42 202 1s113 44 171 9 102-47 191-23" />
        </g>
        <path
          d="M29 473c64 11 71-37 123-41s69 37 113 31 48-57 96-59 62 27 105 12"
          className="field-guide-route"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="29" cy="473" r="4" fill="var(--color-bg-card)" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="466" cy="416" r="4" fill="var(--color-primary)" />
        <circle cx="466" cy="416" r="12" className="field-guide-pin-ring" stroke="currentColor" strokeWidth="1" opacity="0.24" />
      </svg>

      <motion.figure
        className="absolute right-[1%] top-[28%] z-10 mx-auto w-[60%] [transform-style:preserve-3d]"
        style={{ rotateX, rotateY }}
      >
        <div className="relative aspect-[1.12] overflow-hidden rounded-t-[48%] rounded-b-[12px] border-[7px] border-[var(--color-bg-card)] bg-[var(--color-bg-overlay)] shadow-[0_30px_70px_rgba(48,39,28,0.22),0_8px_18px_rgba(48,39,28,0.08)] sm:border-[9px]">
          <motion.div className="absolute -inset-[9px]" style={{ x: imageX, y: imageY }}>
            <PhotoImage
              src={src}
              alt={`Room at ${name}`}
              fill
              priority
              sizes="(max-width: 1024px) 82vw, 42vw"
              className="object-cover contrast-[1.03] saturate-[0.9]"
            />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#211b17]/85 via-[#211b17]/8 to-transparent" aria-hidden="true" />

          <figcaption className="absolute inset-x-0 bottom-0 px-4 pb-4 pt-12 text-[#fffaf3] sm:px-5 sm:pb-5">
            <div className="mb-2 flex items-center justify-between gap-2 whitespace-nowrap font-mono text-[8px] font-[600] uppercase tracking-[0.12em] text-white/75 sm:text-[9px]">
              <span>From the directory · 01</span>
              {verified && (
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck size={12} aria-hidden="true" /> Reviewed
                </span>
              )}
            </div>
            <div className="border-t border-white/30 pt-2.5">
              <h2 className="truncate font-display text-[1.12rem] leading-tight tracking-[-0.02em] text-[#fffaf3] sm:text-[1.35rem]">
                {name}
              </h2>
              <p className="mt-0.5 truncate text-[10px] text-white/80 sm:text-[length:var(--text-body-sm)]">{location}</p>
              {price != null && (
                <p className="mt-1.5 font-display text-[1rem] leading-none sm:text-[1.12rem]">
                  {formatPKR(price)}<span className="ml-1 font-body text-[9px] text-white/75">/ month</span>
                </p>
              )}
            </div>
          </figcaption>
        </div>
      </motion.figure>

      <motion.div
        className="absolute right-[1%] top-[10%] z-20 grid aspect-square w-[25%] place-content-center rounded-full border border-[var(--color-primary)] bg-[var(--color-bg-card)] text-center shadow-[0_14px_28px_rgba(48,39,28,0.16)] sm:right-[3%]"
        style={{ z: 34 }}
        initial={{ opacity: 0, scale: 0.82, rotate: 14 }}
        animate={{ opacity: 1, scale: 1, rotate: 7 }}
        transition={{ type: "spring", stiffness: 120, damping: 13, delay: 0.35 }}
      >
        <MapPin className="mx-auto mb-1 text-[color:var(--color-primary)]" size={14} strokeWidth={1.5} aria-hidden="true" />
        <span className="font-mono text-[7px] font-[700] uppercase tracking-[0.12em] text-[color:var(--color-primary-deep)]">Field note</span>
        <span className="font-display text-[1.05rem] italic leading-none text-[color:var(--color-text-heading)] sm:text-[1.2rem]">No. 01</span>
      </motion.div>

      <motion.div
        className="absolute bottom-[5%] left-[1%] z-20 hidden w-[27%] -rotate-6 border border-[var(--color-primary-light)] bg-[var(--color-bg-card)]/95 p-3 font-mono text-[8px] uppercase leading-[1.5] tracking-[0.09em] text-[color:var(--color-primary-deep)] shadow-[0_12px_26px_rgba(48,39,28,0.12)] sm:block"
        style={{ z: 24 }}
        initial={{ opacity: 0, x: -12, rotate: -12 }}
        animate={{ opacity: 1, x: 0, rotate: -6 }}
        transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.55 }}
      >
        <span className="block border-b border-[var(--color-border-default)] pb-1.5">Monthly rent</span>
        <span className="mt-1.5 block">Shown up front<br />Always in PKR</span>
      </motion.div>
    </div>
  );
}
