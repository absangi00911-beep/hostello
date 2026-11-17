// Path: src/lib/scroll-behavior.ts

/**
 * "smooth" unless the visitor asked their system to reduce motion, then "instant". Smooth scrolling is
 * animation: scrollIntoView and scrollTo ignore the reduced-motion preference by default.
 */
export function getScrollBehavior(): ScrollBehavior {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "auto";
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth";
}
