/**
 * Thin typed wrappers around fetch for client-side API calls.
 * All functions throw on non-OK responses with the server's error message.
 */

import { buildSearchParams } from "@/lib/utils";

async function request<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    credentials: "include", // Send authentication cookies with requests
    ...options,
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(
      typeof json?.error === "string" ? json.error : `Request failed (${res.status})`
    );
  }

  return json.data as T;
}

// ─── Hostels ─────────────────────────────────────────────────────────────────

export interface HostelSummary {
  id: string;
  name: string;
  slug: string;
  city: string;
  area: string | null;
  pricePerMonth: number;
  gender: "MALE" | "FEMALE" | "MIXED";
  amenities: string[];
  coverImage: string | null;
  images: string[];
  verified: boolean;
  rating: number;
  reviewCount: number;
  owner: { id: string; name: string; avatar: string | null };
}

export interface PaginatedHostels {
  data: HostelSummary[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export async function fetchHostels(params: Record<string, string>): Promise<PaginatedHostels> {
  const qs = buildSearchParams(params);
  const res = await fetch(`/api/hostels${qs ? `?${qs}` : ""}`, {
    next: { revalidate: 30 },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to fetch hostels");
  return json as PaginatedHostels;
}

export interface HostelDetail extends HostelSummary {
  description: string;
  address: string;
  minStay: number;
  maxStay: number | null;
  capacity: number;
  rooms: number;
  rules: string[];
  status: "ACTIVE" | "DRAFT" | "PENDING_REVIEW" | "SUSPENDED";
  featured: boolean;
  viewCount: number;
  owner: {
    id: string;
    name: string;
    avatar: string | null;
    createdAt: string;
    _count: { hostels: number };
  };
  reviews: Array<{
    id: string;
    rating: number;
    title: string;
    comment: string;
    createdAt: string;
    user: { id: string; name: string; avatar: string | null };
  }>;
  rooms_rel: Array<{
    id: string;
    name: string;
    description: string;
    pricePerMonth: number;
    capacity: number;
  }>;
  _count: { favorites: number };
}

export async function fetchHostelBySlug(slug: string): Promise<HostelDetail> {
  const res = await fetch(`/api/hostels/${slug}`, {
    next: { revalidate: 30 },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to fetch hostel");
  return json.data as HostelDetail;
}

// ─── Favorites ────────────────────────────────────────────────────────────────

export async function toggleFavorite(slug: string, isSaved: boolean): Promise<boolean> {
  const result = await request<{ saved: boolean }>(
    `/api/hostels/${slug}/favorite`,
    { method: isSaved ? "DELETE" : "POST" }
  );
  return result.saved;
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

export interface CreateBookingPayload {
  hostelId: string;
  roomId?: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  paymentMethod: string;
}

export interface BookingResult {
  id: string;
  hostelId: string;
  checkIn: string;
  checkOut: string;
  total: number;
  status: string;
}

export async function createBooking(payload: CreateBookingPayload): Promise<BookingResult> {
  return request<BookingResult>("/api/bookings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export interface ReviewPayload {
  hostelId: string;
  rating: number;
  title?: string;
  comment: string;
  cleanliness?: number;
  location?: number;
  value?: number;
  safety?: number;
}

export async function submitReview(payload: ReviewPayload) {
  return request("/api/reviews", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
