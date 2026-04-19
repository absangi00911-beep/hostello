import { emailLayout, emailButton } from "./layout";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://hostello.pk";

export function passwordResetEmail({
  name, resetUrl,
}: {
  name: string; resetUrl: string;
}) {
  const firstName = name.split(" ")[0];

  const content = `
    <h1 style="margin:0 0 10px;font-size:22px;font-weight:700;color:#1A1209;">
      Reset your password
    </h1>
    <p style="margin:0 0 20px;font-size:15px;color:#6B6354;line-height:1.6;">
      Hi ${firstName}, we got a request to reset your HostelLo password.
      The link below expires in 30 minutes.
    </p>
    ${emailButton("Reset password", resetUrl)}
    <p style="margin:24px 0 0;font-size:13px;color:#A68B5B;">
      Didn't request this? You can ignore this email — your password hasn't changed.
    </p>
  `;

  return {
    subject: "Reset your HostelLo password",
    html:    emailLayout(content, "Reset your password"),
  };
}
