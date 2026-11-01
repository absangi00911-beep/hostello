"use client";

import { useEffect, useState, type ReactNode } from "react";

export function ScrollAwareSurface({
  as,
  ariaLabel,
  children,
  className,
  scrolledClassName,
}: {
  as: "header" | "nav";
  ariaLabel?: string;
  children: ReactNode;
  className: string;
  scrolledClassName: string;
}) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    function updateScrollState() {
      setIsScrolled(window.scrollY > 0);
    }

    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateScrollState);
    };
  }, []);

  const Element = as;
  const classes = [
    className,
    "transition-shadow duration-200 motion-reduce:transition-none",
    isScrolled ? scrolledClassName : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Element
      aria-label={ariaLabel}
      className={classes}
      data-scrolled={isScrolled ? "true" : "false"}
    >
      {children}
    </Element>
  );
}
