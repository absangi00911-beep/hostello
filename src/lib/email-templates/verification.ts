import { emailLayout, emailButton } from "./layout";

export function verificationEmail({
  name,
  verifyUrl,
}: {
  name: string;
  verifyUrl: string;
}) {
  const firstName = name.split(" ")[0];

  const content = `
    <h1 style="margin:0 0 8px 0;font-size:22px;font-weight:700;color:#1A1209;">
      Confirm your email address
    </h1>
    <p style="margin:0 0 24px 0;font-size:15px;color:#6B6354;line-height:1.6;">
      Hi ${firstName}, click the button below to verify your HostelLo account.
      This link expires in 24 hours.
    </p>

    ${emailButton("Verify email address", verifyUrl)}

    <hr style="margin:32px 0;border:none;border-top:1px solid #EAE0D0;" />
    <p style="margin:0;font-size:12px;color:#A68B5B;">
      Didn't create a HostelLo account? You can safely ignore this email.
    </p>
  `;

  return {
    subject: "Verify your HostelLo email address",
    html: emailLayout(content, "Confirm your email address"),
  };
}
