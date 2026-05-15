// Path: src/lib/utils.ts

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export {
  formatPrice,
  formatDate,
  slugify,
  truncate,
  pluralize,
  getInitials,
  calculateMonths,
  sanitizeString
} from "@hostello/shared";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function buildSearchParams(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      if (Array.isArray(value)) {
        value.forEach((v) => searchParams.append(key, String(v)));
      } else {
        searchParams.set(key, String(value));
      }
    }
  }
  return searchParams.toString();
}
