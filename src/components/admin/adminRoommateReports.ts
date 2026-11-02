export interface RoommateReportEntry {
  id: string;
  reason: string;
  createdAt: string;
  reporterName: string;
}

export interface ReportedRoommatePost {
  id: string;
  bio: string;
  budget: number | null;
  moveIn: string | null;
  createdAt: string;
  expiresAt: string;
  hostelName: string;
  hostelSlug: string;
  authorName: string;
  /** Most recent reports; the API returns at most 50 per post. */
  reports: RoommateReportEntry[];
  /** Every report on the post, which can exceed `reports.length`. */
  reportCount: number;
}

export interface ReportedRoommatePostsPage {
  data: ReportedRoommatePost[];
  total: number;
  page: number;
  /** Reports at which a post is hidden from student listings. */
  hideThreshold: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isValidDateString(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function parseReport(value: unknown): RoommateReportEntry | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.reason !== "string" ||
    !isValidDateString(value.createdAt)
  ) {
    return null;
  }
  return {
    id: value.id,
    reason: value.reason,
    createdAt: value.createdAt,
    reporterName:
      isRecord(value.reporter) && typeof value.reporter.name === "string"
        ? value.reporter.name
        : "A student",
  };
}

function parsePost(value: unknown): ReportedRoommatePost | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.bio !== "string" ||
    !isValidDateString(value.createdAt) ||
    !isValidDateString(value.expiresAt) ||
    !isRecord(value.hostel) ||
    typeof value.hostel.name !== "string" ||
    typeof value.hostel.slug !== "string" ||
    !isRecord(value.user) ||
    typeof value.user.name !== "string" ||
    !Array.isArray(value.reports)
  ) {
    return null;
  }
  const reports = value.reports.map(parseReport);
  if (reports.some((report) => report === null)) return null;
  const count = isRecord(value._count) ? value._count.reports : null;
  return {
    id: value.id,
    bio: value.bio,
    budget: typeof value.budget === "number" ? value.budget : null,
    moveIn: isValidDateString(value.moveIn) ? value.moveIn : null,
    createdAt: value.createdAt,
    expiresAt: value.expiresAt,
    hostelName: value.hostel.name,
    hostelSlug: value.hostel.slug,
    authorName: value.user.name,
    reports: reports as RoommateReportEntry[],
    reportCount: typeof count === "number" ? count : reports.length,
  };
}

/** Parses `GET /api/admin/roommate-reports`; null when the shape is unexpected. */
export function parseReportedRoommatePostsPage(
  value: unknown,
): ReportedRoommatePostsPage | null {
  if (
    !isRecord(value) ||
    !Array.isArray(value.data) ||
    typeof value.total !== "number" ||
    typeof value.page !== "number" ||
    typeof value.hideThreshold !== "number"
  ) {
    return null;
  }
  const data = value.data.map(parsePost);
  if (data.some((post) => post === null)) return null;
  return {
    data: data as ReportedRoommatePost[],
    total: value.total,
    page: value.page,
    hideThreshold: value.hideThreshold,
  };
}

/** The list response has no `hasMore`, so it is derived from the page size. */
export function hasMoreReportedPosts(
  page: number,
  limit: number,
  total: number,
): boolean {
  return page * limit < total;
}

/** A post is hidden from students once it reaches the threshold. */
export function isHiddenFromStudents(
  reportCount: number,
  hideThreshold: number,
): boolean {
  return reportCount >= hideThreshold;
}

/** `now` is passed in (epoch ms) so rendering stays pure and testable. */
export function isPostExpired(expiresAt: string, now: number): boolean {
  return new Date(expiresAt).getTime() < now;
}

export function deletePostMessage(authorName: string, hostelName: string): string {
  return `${authorName}'s post on ${hostelName} was deleted.`;
}
