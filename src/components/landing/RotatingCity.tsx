"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { CITIES } from "@hostello/shared";

const HERO_CITIES = ["Pakistan", ...CITIES];

export function RotatingCity() {
  const [cityIndex, setCityIndex] = useState(0);
  const city = HERO_CITIES[cityIndex];

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const interval = window.setInterval(() => {
      setCityIndex((currentIndex) => (currentIndex + 1) % HERO_CITIES.length);
    }, 3200);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <span className="inline-grid min-w-[10ch] whitespace-nowrap align-baseline" aria-live="off">
      <AnimatePresence initial={false} mode="wait">
        <motion.span
          key={city}
          className="col-start-1 row-start-1 inline-block justify-self-start bg-gradient-to-r from-digital-blue-500 via-digital-blue-600 to-digital-blue-700 bg-clip-text font-[700] italic text-transparent"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          {city}.
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
