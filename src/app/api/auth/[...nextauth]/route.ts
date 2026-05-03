import { handlers } from "@/lib/auth/config";

export const { GET, POST } = handlers;

// Disable Edge Runtime for this route since Prisma isn't compatible with Edge Runtime
// The session callback needs to run Prisma queries for token validation
export const runtime = "nodejs";
