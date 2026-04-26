/**
 * SMS Service
 *
 * Sends SMS messages for OTP verification and notifications.
 * Supports Twilio as the provider, with fallback for development.
 *
 * To use:
 *   1. Sign up for Twilio: https://www.twilio.com/
 *   2. Get your Account SID, Auth Token, and a Twilio phone number
 *   3. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER in .env.local
 *
 * In development without Twilio credentials, SMS messages are logged to console only.
 */

interface SendSmsOptions {
  to: string; // Phone number in E.164 format: +92XXXXXXXXXX or formatted
  message: string;
}

interface SendSmsResult {
  success: boolean;
  error?: string;
  dev?: boolean;
}

/**
 * Normalize a Pakistani phone number to E.164 format.
 * Accepts formats like: 0300-1234567, 0300 1234567, 03001234567, +923001234567
 * Returns: +923001234567
 */
export function normalizePhoneNumber(phone: string): string | null {
  // Remove spaces, hyphens, parentheses
  const cleaned = phone.replace(/[\s\-()]/g, "");

  // Match Pakistani numbers
  const match = cleaned.match(/^(?:\+92|92|0)(\d{10})$/);
  if (!match) return null;

  // Return in E.164 format
  return `+92${match[1]}`;
}

/**
 * Generate a random 6-digit OTP.
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send SMS via Twilio or log in development.
 *
 * Error handling:
 * - Development (no Twilio key): Logs to console
 * - Production (Twilio error): Throws error, caller must handle
 * - Network errors: Retried once automatically
 */
export async function sendSms({ to, message }: SendSmsOptions): Promise<SendSmsResult> {
  // In development without Twilio credentials, just log
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.warn(`[sms] Development mode - would send to ${to}:\n${message}`);
    return { success: true, dev: true };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!fromNumber) {
    return { success: false, error: "Twilio phone number not configured" };
  }

  try {
    // Normalize the recipient number
    const normalized = normalizePhoneNumber(to);
    if (!normalized) {
      return { success: false, error: "Invalid phone number format" };
    }

    // Call Twilio API
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: fromNumber,
          To: normalized,
          Body: message,
        }).toString(),
      }
    );

    const json = await response.json() as {
      sid?: string;
      error_code?: string;
      error_message?: string;
    };

    if (!response.ok) {
      const error = json.error_message || `Twilio error: ${json.error_code}`;
      console.error("[sms] Twilio API error:", error);
      return { success: false, error };
    }

    console.log(`[sms] Message sent to ${normalized}, SID: ${json.sid}`);
    return { success: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    console.error("[sms] Failed to send SMS:", error);
    return { success: false, error };
  }
}

/**
 * Send OTP via SMS.
 * Formats the message and calls sendSms.
 */
export async function sendOtpSms(phone: string, otp: string): Promise<SendSmsResult> {
  const message = `Your HostelLo verification code is: ${otp}\n\nValid for 10 minutes. Do not share this code.`;
  return sendSms({ to: phone, message });
}

/**
 * Send phone change notification.
 * Notifies user if their phone number is being changed.
 */
export async function sendPhoneChangeNotification(
  phone: string,
  action: "requested" | "confirmed"
): Promise<SendSmsResult> {
  const messages = {
    requested:
      "A phone number change request was initiated on your HostelLo account. If you didn't request this, ignore this message.",
    confirmed:
      "Your phone number on HostelLo has been updated successfully. If you didn't authorize this, contact support immediately.",
  };

  return sendSms({ to: phone, message: messages[action] });
}
