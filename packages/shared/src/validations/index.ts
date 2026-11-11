import { z } from "zod";
import { getPakistanCalendarDate, isWholeMonthStay } from "../utils/dates";
import { MAX_BOOKING_MONTHS } from "../constants/config";
import { ENABLED_PAYMENT_METHODS } from "../constants/payment-methods";

// -- Sanitization --

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

export const roomTypeSchema = z.object({
  id: z.string().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/).optional(),
  name: z
    .string()
    .min(2)
    .max(100)
    .transform(sanitizeString)
    .refine((name) => name.length >= 2, "Room name must contain at least 2 characters"),
  description: z
    .string()
    .max(1000)
    .optional()
    .transform((description) => (description ? sanitizeString(description) : undefined))
    .refine(
      (description) => description === undefined || description.length > 0,
      "Room description cannot be empty",
    ),
  pricePerMonth: z.number().int().min(1000).max(100000),
  capacity: z.number().int().min(1).max(100),
  facilities: z
    .array(
      z
        .string()
        .min(1)
        .max(100)
        .transform(sanitizeString)
        .refine((facility) => facility.length > 0, "Facility cannot be empty"),
    )
    .max(30),
  images: z.array(z.string().max(2048)).max(15),
});

const roomTypesSchema = z
  .array(roomTypeSchema)
  .min(1, "Add at least one room type")
  .max(100, "Cannot add more than 100 room types")
  .refine(
    (rooms) => {
      const ids = rooms.flatMap((room) => room.id ? [room.id] : []);
      return new Set(ids).size === ids.length;
    },
    "Room IDs must be unique",
  );

// -- Auth --

export const newPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be no more than 128 characters")
  .regex(/[A-Z]/, "Include at least one uppercase letter")
  .regex(/[0-9]/, "Include at least one number")
  .refine(
    (password) => new TextEncoder().encode(password).byteLength <= 72,
    "Password must be no more than 72 UTF-8 bytes",
  );

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
    password: newPasswordSchema,
    confirmPassword: z.string().optional(),
    role: z.enum(["STUDENT", "OWNER"]),
  })
  .refine((data) => !data.confirmPassword || data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// --- Hostel -------------------------------------------------------------------

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
  cancellationPolicy: z.enum(["FLEXIBLE", "STANDARD", "STRICT"]),
  minStay: z.number().int().min(1),
  maxStay: z.number().int().optional(),
  amenities: z.array(z.string()).min(1, "Select at least one amenity"),
  rules: rulesSchema,
  images: z.array(z.string().max(2_048)).max(15).optional(),
  coverImage: z.string().max(2_048).optional(),
  roomTypes: roomTypesSchema,
});

// --- Review -------------------------------------------------------------------

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

// --- Booking ------------------------------------------------------------------

const dateOnlySchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a calendar date in YYYY-MM-DD format")
  .transform((value, context) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
      context.addIssue({ code: "custom", message: "Enter a valid calendar date" });
      return z.NEVER;
    }
    return date;
  });

function validateStayDates(
  data: { checkIn: Date; checkOut: Date },
  context: z.RefinementCtx,
) {
  // Invalid date-only strings already carry parser issues; avoid touching a
  // z.NEVER placeholder during the cross-field refinement.
  if (!(data.checkIn instanceof Date) || !(data.checkOut instanceof Date) ||
      !Number.isFinite(data.checkIn.getTime()) || !Number.isFinite(data.checkOut.getTime())) {
    return;
  }
  if (data.checkIn < getPakistanCalendarDate()) {
    context.addIssue({
      code: "custom",
      message: "Check-in must be today or later in Pakistan.",
      path: ["checkIn"],
    });
  }
  if (data.checkOut <= data.checkIn) {
    context.addIssue({
      code: "custom",
      message: "Check-out must be after check-in.",
      path: ["checkOut"],
    });
    return;
  }

  const monthDifference =
    (data.checkOut.getUTCFullYear() - data.checkIn.getUTCFullYear()) * 12 +
    (data.checkOut.getUTCMonth() - data.checkIn.getUTCMonth());
  if (monthDifference > MAX_BOOKING_MONTHS) {
    context.addIssue({
      code: "custom",
      message: `A stay cannot exceed ${MAX_BOOKING_MONTHS} months.`,
      path: ["checkOut"],
    });
  }
  if (!isWholeMonthStay(data.checkIn, data.checkOut)) {
    context.addIssue({
      code: "custom",
      message: "Choose a whole-month stay; check-out must match the monthly term from check-in.",
      path: ["checkOut"],
    });
  }
}

export const bookingSchema = z
  .object({
    hostelId: z.string().cuid(),
    roomId: z.string().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/),
    checkIn: dateOnlySchema,
    checkOut: dateOnlySchema,
    guests: z.number().int().min(1).max(4),
    paymentMethod: z.enum(ENABLED_PAYMENT_METHODS),
  })
  .superRefine(validateStayDates);

export const exactAvailabilitySchema = z
  .object({
    checkIn: dateOnlySchema,
    checkOut: dateOnlySchema,
    guests: z.coerce.number().int().min(1).max(4),
  })
  .superRefine(validateStayDates);

export const blockedDateSchema = z
  .object({
    startDate: dateOnlySchema,
    endDate: dateOnlySchema,
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date must be on or after start date.",
    path: ["endDate"],
  });

// --- Search -------------------------------------------------------------------

export const searchParamsSchema = z.object({
  q: z.string().optional(),
  city: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "MIXED"]).optional(),
  minPrice: z.coerce.number().finite().nonnegative().optional(),
  maxPrice: z.coerce.number().finite().nonnegative().optional(),
  amenities: z.array(z.string()).optional(),
  // Not z.coerce.boolean(): that turns every non-empty string, including
  // "false", into true.
  verified: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
  sort: z.enum(["price_asc", "price_desc", "rating", "newest"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

// --- Profile -----------------------------------------------------------------

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
    currentPassword: z.string().min(1, "Current password is required").max(128),
    newPassword: newPasswordSchema,
    confirmPassword: z.string().max(128),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type HostelCreateInput = z.infer<typeof hostelCreateSchema>;
export type RoomTypeInput = z.infer<typeof roomTypeSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
export type SearchParamsInput = z.infer<typeof searchParamsSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type PasswordInput = z.infer<typeof passwordSchema>;
