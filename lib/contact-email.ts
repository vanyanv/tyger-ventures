import type { ContactValues } from "@/lib/contact";

/**
 * The "Night" email a contact letter arrives as: the site's dark ground, the ember tiger, the
 * sender's name in the verse's italic, their note, and a button that replies to them.
 *
 * Built for mail apps: tables, inline styles, a hosted PNG. Apple Mail loads the site's fonts;
 * Gmail and Outlook fall back to Georgia and their system sans.
 */

const SERIF = "'Bodoni Moda',Didot,'Bodoni MT',Georgia,serif";
const SANS = "'Schibsted Grotesk',-apple-system,'Segoe UI',Helvetica,Arial,sans-serif";
const FONTS =
  "https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@1,6..96,400&family=Schibsted+Grotesk:wght@400..600&display=swap";

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Where the site is served from, for the image in the email. Follows the production domain on Vercel. */
export function siteOrigin(): string {
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return host ? `https://${host}` : "https://tyger-ventures.vercel.app";
}

/** "Tuesday, November 24 at 1:15 PM PST". Pacific time, where the letters are read. */
export function formatReceived(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

interface ContactEmailOptions {
  /** When the letter was sent, already formatted. */
  received: string;
  /** Origin the tiger image is loaded from, without a trailing slash. */
  origin: string;
}

export function contactEmailHtml(values: ContactValues, { received, origin }: ContactEmailOptions): string {
  const name = escapeHtml(values.name);
  const company = escapeHtml(values.company);
  const email = escapeHtml(values.email);
  const message = escapeHtml(values.message);
  const first = escapeHtml(values.name.split(/\s+/)[0] ?? "");
  const reply = `mailto:${encodeURIComponent(values.email)}?subject=${encodeURIComponent("Re: your letter to Tyger Ventures")}`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<link rel="stylesheet" href="${FONTS}">
</head>
<body style="margin:0;padding:0;background:#06090a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#06090a" style="background:#06090a"><tr><td align="center" style="padding:36px 16px 40px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px">
<tr><td align="center" style="font:600 11px/1 ${SANS};letter-spacing:0.24em;text-transform:uppercase;color:#ece6d8">Tyger Ventures</td></tr>
<tr><td align="center" style="padding:14px 0 6px"><img src="${origin}/email/ember-tiger.png" width="340" alt="The Tyger Ventures tiger" style="display:block;width:340px;max-width:82%;height:auto;border:0"></td></tr>
<tr><td align="center" style="font:11px/1.4 ${SANS};letter-spacing:0.2em;text-transform:uppercase;color:#8f8b7d">A new letter from</td></tr>
<tr><td align="center" style="padding:10px 0 0;font:italic 400 38px/1.12 ${SERIF};color:#fff0c9">${name}</td></tr>
<tr><td align="center" style="padding:10px 0 0;font:15px/1.5 ${SANS};color:#8f8b7d">${company ? `${company}<br>` : ""}<a href="mailto:${email}" style="color:#ff9a2e;text-decoration:none">${email}</a></td></tr>
<tr><td style="padding:28px 0 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td height="1" style="height:1px;line-height:1px;font-size:1px;background:#2a2c29">&nbsp;</td></tr></table></td></tr>
<tr><td style="padding:26px 4px 0;font:16px/1.65 ${SANS};color:#ece6d8;white-space:pre-wrap">${message}</td></tr>
<tr><td align="center" style="padding:34px 0 0"><a href="${reply}" style="display:inline-block;padding:14px 30px;border:1px solid #b06a1e;border-radius:999px;background:#2a1a09;font:500 14px/1 ${SANS};letter-spacing:0.02em;color:#fff0c9;text-decoration:none">Reply to ${first} &nbsp;&#8599;</a></td></tr>
<tr><td align="center" style="padding:34px 12px 0;font:12px/1.55 ${SANS};color:#8f8b7d">${escapeHtml(received)}<br>Sent from the contact page at tygerventures.com. Replying to this email answers ${first} directly.</td></tr>
</table></td></tr></table>
</body>
</html>`;
}
