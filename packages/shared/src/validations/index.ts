import { z } from "zod";

// ─── Sanitization ─────────────────────────────────────────────────────────────

/**
 * Sanitizes a string by removing HTML tags and dangerous content.
 * Prevents XSS by stripping tags and the inner content of <script>, <style>, etc.
 */
export function sanitizeString(input: string): string {
  if (!input) return "";

  // 1. Remove dangerous tags and their content (script, style, iframe, object, embed)
  let sanitized = input.replace(
    /<(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\/\1>/gi,
    ""
  );

  // 2. Remove all other HTML tags, including unclosed tags
  sanitized = sanitized.replace(/<[^>]*>?/g, "");

  // 3. Trim whitespace
  return sanitized.trim();
}

/**
 * Validates and sanitizes house rules.
 */
export const rulesSchema = z
  .array(
    z
      .string()
      .min(1, "Rule cannot be empty")
      .max(200, "Rule cannot exceed 200 characters")
      .transform(sanitizeString)
      .refine(
        (rule) => !/<[^>]*>/.test(rule),
        "HTML tags are not allowed"
      )
  )
  .max(20, "Cannot have more than 20 rules");

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Enter a valid email address"),
    phone: z
      .string()
      .regex(/^(\+92|0)[0-9]{10}$/, "Enter a valid Pakistani phone number")
      .optional()
      .or(z.literal("")),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Include at least one uppercase letter")
      .regex(/[0-9]/, "Include at least one number"),
    confirmPassword: z.string().optional(),
    role: z.enum(["STUDENT", "OWNER"]),
  })
  .refine((data) => !data.confirmPassword || data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ─── Hostel ───────────────────────────────────────────────────────────────────

export const hostelCreateSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100).transform(sanitizeString),
  description: z
    .string()
    .min(50, "Description must be at least 50 characters")
    .max(2000)
    .transform(sanitizeString),
  city: z.string().min(1, "Select a city").transform(sanitizeString),
  area: z.string().optional().transform((v) => (v ? sanitizeString(v) : undefined)),
  address: z.string().min(10, "Enter the full address").transform(sanitizeString),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  pricePerMonth: z
    .number()
    .min(1000, "Price must be at least Rs. 1,000")
    .max(100000, "Price cannot exceed Rs. 100,000"),
  rooms: z.number().int().min(1).max(500),
  capacity: z.number().int().min(1).max(1000),
  gender: z.enum(["MALE", "FEMALE", "MIXED"]),
  minStay: z.number().int().min(1),
  maxStay: z.number().int().optional(),
  amenities: z.array(z.string()).min(1, "Select at least one amenity"),
  rules: rulesSchema,
});

// ─── Review ───────────────────────────────────────────────────────────────────

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  comment: z
    .string()
    .min(20, "Review must be at least 20 characters")
    .max(1000),
  cleanliness: z.number().int().min(0).max(5),
  location: z.number().int().min(0).max(5),
  value: z.number().int().min(0).max(5),
  safety: z.number().int().min(0).max(5),
});

// ─── Booking ──────────────────────────────────────────────────────────────────

export const bookingSchema = z
  .object({
    hostelId: z.string().cuid(),
    roomId: z.string().cuid().optional(),
    checkIn: z.coerce.date(),
    checkOut: z.coerce.date(),
    guests: z.number().int().min(1).max(4),
    paymentMethod: z.enum(["safepay", "jazzcash", "easypaisa"]),
  })
  .refine((data) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkInDate = new Date(data.checkIn);
    checkInDate.setHours(0, 0, 0, 0);
    return checkInDate >= today;
  }, {
    message: "Check-in must be today or later",
    path: ["checkIn"],
  })
  .refine((data) => data.checkOut > data.checkIn, {
    message: "Check-out must be after check-in",
    path: ["checkOut"],
  });

// ─── Search ───────────────────────────────────────────────────────────────────

export const searchParamsSchema = z.object({
  q: z.string().optional(),
  city: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "MIXED"]).optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  amenities: z.array(z.string()).optional(),
  verified: z.coerce.boolean().optional(),
  sort: z.enum(["price_asc", "price_desc", "rating", "newest"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

// ─── Profile ─────────────────────────────────────────────────────────────────

export const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z
    .string()
    .regex(/^(\+92|0)[0-9]{10}$/, "Enter a valid Pakistani phone number")
    .optional()
    .or(z.literal("")),
});

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Include at least one uppercase letter")
      .regex(/[0-9]/, "Include at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type HostelCreateInput = z.infer<typeof hostelCreateSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
export type SearchParamsInput = z.infer<typeof searchParamsSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type PasswordInput = z.infer<typeof passwordSchema>;
