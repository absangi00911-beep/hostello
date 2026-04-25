import { escapeHtml } from "@/lib/email";
import { emailLayout, emailButton } from "./layout";
import { getAppUrl } from "@/lib/app-url";

interface WelcomeEmailProps {
  name: string;
  role: "STUDENT" | "OWNER";
}

/**
 * Sent once, right after a user creates their account.
 * - Students get a link to browse hostels.
 * - Owners get a link to list their first hostel.
 */
export function welcomeEmail({ name, role }: WelcomeEmailProps) {
  const APP_URL = getAppUrl();
  const firstName = escapeHtml(name.split(" ")[0]);

  const isOwner = role === "OWNER";

  const content = `
    <h1 style="margin:0 0 8px 0;font-size:24px;font-weight:700;color:#1A1209;">
      Welcome, ${firstName} 👋
    </h1>
    <p style="margin:0 0 20px 0;font-size:15px;color:#6B6354;line-height:1.6;">
      ${
        isOwner
          ? "Your HostelLo owner account is ready. Start by listing your first hostel — it takes about 5 minutes."
          : "Your HostelLo account is ready. Start browsing verified student hostels across Pakistan."
      }
    </p>

    ${
      isOwner
        ? emailButton("List your hostel", `${APP_URL}/dashboard/hostels/new`)
        : emailButton("Browse hostels", `${APP_URL}/hostels`)
    }

    <hr style="margin:32px 0;border:none;border-top:1px solid #EAE0D0;" />

    <p style="margin:0;font-size:13px;color:#A68B5B;line-height:1.6;">
      If you have any questions, reply to this email or visit our
      <a href="${APP_URL}/help" style="color:#0D3B2E;">Help Centre</a>.
    </p>
  `;

  return {
    subject: `Welcome to HostelLo, ${firstName}!`,
    html: emailLayout(content, `Your HostelLo account is ready.`),
  };
}
