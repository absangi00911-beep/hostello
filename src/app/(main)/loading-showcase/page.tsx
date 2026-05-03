"use client";

import { useState } from "react";
import {
  Spinner,
  SpinnerAlt,
  LoadingPulse,
  LoadingDots,
  LoadingOverlay,
} from "@/components/ui/loading";
import { Skeleton, SkeletonText, SkeletonCard, SkeletonGrid } from "@/components/ui/skeleton";

export default function LoadingShowcasePage() {
  const [showOverlay, setShowOverlay] = useState(false);

  return (
    <div className="min-h-screen pt-24 pb-16 bg-[var(--color-ground)]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <h1
          className="text-4xl font-extrabold text-[var(--color-ink)] mb-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Loading Indicators Showcase
        </h1>
        <p className="text-lg text-[var(--color-ink-muted)] mb-12">
          Enhanced loading states and skeleton components for better UX
        </p>

        {/* Spinners */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-[var(--color-ink)] mb-6" style={{ fontFamily: "var(--font-display)" }}>
            Spinners
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-white p-6 rounded-2xl border border-[var(--color-border)]">
            <div className="flex flex-col items-center gap-3">
              <Spinner size="sm" />
              <span className="text-sm text-[var(--color-muted)]">Small</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Spinner size="md" />
              <span className="text-sm text-[var(--color-muted)]">Medium</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Spinner size="lg" />
              <span className="text-sm text-[var(--color-muted)]">Large</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <SpinnerAlt size="sm" />
              <span className="text-sm text-[var(--color-muted)]">Alt Small</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <SpinnerAlt size="md" />
              <span className="text-sm text-[var(--color-muted)]">Alt Medium</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <SpinnerAlt size="lg" />
              <span className="text-sm text-[var(--color-muted)]">Alt Large</span>
            </div>
          </div>
        </section>

        {/* Loading Indicators */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-[var(--color-ink)] mb-6" style={{ fontFamily: "var(--font-display)" }}>
            Loading Indicators
          </h2>
          <div className="space-y-4 bg-white p-6 rounded-2xl border border-[var(--color-border)]">
            <div>
              <p className="text-sm font-semibold text-[var(--color-ink)] mb-2">Pulse</p>
              <LoadingPulse text="Processing" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-ink)] mb-2">Dots</p>
              <LoadingDots />
            </div>
          </div>
        </section>

        {/* Skeletons */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-[var(--color-ink)] mb-6" style={{ fontFamily: "var(--font-display)" }}>
            Skeleton Loaders
          </h2>
          <div className="space-y-6">
            {/* Text skeleton */}
            <div className="bg-white p-6 rounded-2xl border border-[var(--color-border)]">
              <p className="text-sm font-semibold text-[var(--color-ink)] mb-4">Text Skeleton</p>
              <SkeletonText lines={3} />
            </div>

            {/* Card skeleton */}
            <div className="bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden">
              <p className="text-sm font-semibold text-[var(--color-ink)] p-6 pb-0">Card Skeleton</p>
              <SkeletonCard />
            </div>

            {/* Grid skeleton */}
            <div className="bg-white p-6 rounded-2xl border border-[var(--color-border)]">
              <p className="text-sm font-semibold text-[var(--color-ink)] mb-4">Grid Skeleton (3 items)</p>
              <SkeletonGrid count={3} />
            </div>
          </div>
        </section>

        {/* Loading Overlay */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-[var(--color-ink)] mb-6" style={{ fontFamily: "var(--font-display)" }}>
            Loading Overlay
          </h2>
          <div className="space-y-4">
            <button
              onClick={() => setShowOverlay(!showOverlay)}
              className="px-6 py-3 rounded-lg bg-[var(--color-brand-600)] text-white font-semibold hover:bg-[var(--color-brand-700)] transition-colors"
            >
              {showOverlay ? "Hide Overlay" : "Show Overlay"}
            </button>
            <LoadingOverlay isLoading={showOverlay}>
              <div className="bg-white p-12 rounded-2xl border border-[var(--color-border)] text-center">
                <p className="text-lg font-semibold text-[var(--color-ink)]">
                  Content Here
                </p>
                <p className="text-sm text-[var(--color-muted)] mt-2">
                  Click button to toggle overlay
                </p>
              </div>
            </LoadingOverlay>
          </div>
        </section>

        {/* Animation Classes Reference */}
        <section>
          <h2 className="text-2xl font-bold text-[var(--color-ink)] mb-6" style={{ fontFamily: "var(--font-display)" }}>
            CSS Animation Classes
          </h2>
          <div className="bg-white p-6 rounded-2xl border border-[var(--color-border)]">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 rounded-full bg-[var(--color-brand-600)] pulse" />
                <span className="text-sm text-[var(--color-ink)]"><code>.pulse</code> - Subtle opacity pulse</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-[var(--color-ground)] skeleton" />
                <span className="text-sm text-[var(--color-ink)]"><code>.skeleton</code> - Shimmer effect</span>
              </div>
              <div className="flex items-center gap-4">
                <Spinner size="sm" />
                <span className="text-sm text-[var(--color-ink)]"><code>.spinner</code> - Fast rotation (0.8s)</span>
              </div>
              <div className="flex items-center gap-4">
                <SpinnerAlt size="sm" />
                <span className="text-sm text-[var(--color-ink)]"><code>.spinner-sm</code> - Slower rotation (0.6s)</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
