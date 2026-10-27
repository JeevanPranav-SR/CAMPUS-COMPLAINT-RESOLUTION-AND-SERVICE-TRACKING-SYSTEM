const TIMEOUT_MS = 6000;

export type DeliveryResult = "sent" | "skipped" | "failed";

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.NOTIFY_FROM_EMAIL);
}

export function smsConfigured() {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER);
}

/** Indian mobile numbers are stored as typed by users ("99429 21201"); Twilio needs E.164. */
export function toE164(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return phone.trim().startsWith("+") ? `+${digits}` : null;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

export async function sendEmail(to: string, subject: string, text: string, link?: string): Promise<DeliveryResult> {
  if (!emailConfigured()) return "skipped";
  const html = `<div style="font-family:system-ui,sans-serif;line-height:1.5">
<p style="font-weight:600;color:#1d3a8a">BIT NEXUS · Campus service desk</p>
<p>${escapeHtml(text)}</p>
${link ? `<p><a href="${escapeHtml(link)}">Open the ticket</a></p>` : ""}
<p style="color:#64748b;font-size:12px">Bannari Amman Institute of Technology. Change alerts from your profile.</p>
</div>`;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.NOTIFY_FROM_EMAIL, to: [to], subject, text, html }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return response.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}

export async function sendSms(phone: string, text: string): Promise<DeliveryResult> {
  if (!smsConfigured()) return "skipped";
  const to = toE164(phone);
  if (!to) return "failed";
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const auth = Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64");
  try {
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ To: to, From: process.env.TWILIO_FROM_NUMBER!, Body: text.slice(0, 300) }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return response.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}
