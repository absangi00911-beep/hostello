import { z } from "zod";

import { sendEmail } from "./email";
import { emailLayout, emailRow } from "./email-templates/layout";

export const contactSchema = z.object({
  name: z.string().min(2, "Enter your name"),
  email: z.string().email("Enter a valid email"),
  subject: z.string().min(5, "Enter a subject"),
  message: z.string().min(20, "Message must be at least 20 characters"),
});

export const reportSchema = z.object({
  type: z.enum(["listing", "review", "payment", "safety", "other"]),
  description: z.string().min(20, "Please describe the issue in at least 20 characters"),
  url: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
});

export type ContactInput = z.infer<typeof contactSchema>;
export type ReportInput = z.infer<typeof reportSchema>;

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

type EmailResult = Awaited<ReturnType<typeof sendEmail>>;
type EmailSender = (payload: EmailPayload) => Promise<EmailResult>;

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL ?? "support@hostello.pk";

const REPORT_LABELS: Record<ReportInput["type"], string> = {
  listing: "Listing issue",
  review: "Review issue",
  payment: "Payment issue",
  safety: "Safety concern",
  other: "Other issue",
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatMultiline(value: string) {
  return escapeHtml(value).replaceAll("\n", "<br />");
}

function renderContactEmail(input: ContactInput) {
  return emailLayout(`
    <p style="margin:0 0 16px;font-size:16px;color:#1A1209;font-weight:700;">
      New contact message
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      ${emailRow("Name", escapeHtml(input.name))}
      ${emailRow("Email", escapeHtml(input.email))}
      ${emailRow("Subject", escapeHtml(input.subject))}
    </table>
    <div style="margin-top:24px;padding:16px;border-radius:12px;background:#FAF7F0;border:1px solid #EAE0D0;">
      <p style="margin:0 0 8px;font-size:13px;color:#A68B5B;font-weight:600;">Message</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#1A1209;">
        ${formatMultiline(input.message)}
      </p>
    </div>
  `, "New contact message from HostelLo");
}

function renderIssueReportEmail(input: ReportInput) {
  const typeLabel = REPORT_LABELS[input.type];
  const reporter = input.email || "Anonymous";
  const pageUrl = input.url || "Not provided";

  return emailLayout(`
    <p style="margin:0 0 16px;font-size:16px;color:#1A1209;font-weight:700;">
      New issue report
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      ${emailRow("Issue type", escapeHtml(typeLabel))}
      ${emailRow("Reporter", escapeHtml(reporter))}
      ${emailRow("Page URL", escapeHtml(pageUrl))}
    </table>
    <div style="margin-top:24px;padding:16px;border-radius:12px;background:#FAF7F0;border:1px solid #EAE0D0;">
      <p style="margin:0 0 8px;font-size:13px;color:#A68B5B;font-weight:600;">Description</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#1A1209;">
        ${formatMultiline(input.description)}
      </p>
    </div>
  `, "New issue report from HostelLo");
}

export async function sendContactMessage(input: ContactInput, emailSender: EmailSender = sendEmail) {
  return emailSender({
    to: SUPPORT_EMAIL,
    subject: `[Contact] ${input.subject}`,
    html: renderContactEmail(input),
  });
}

export async function sendIssueReport(input: ReportInput, emailSender: EmailSender = sendEmail) {
  return emailSender({
    to: SUPPORT_EMAIL,
    subject: `[Report] ${REPORT_LABELS[input.type]}`,
    html: renderIssueReportEmail(input),
  });
}
