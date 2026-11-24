"use server";

import { headers } from "next/headers";
import { Resend } from "resend";

import { CONTACT_LIMITS, CONTACT_ORDER, validateContact, type ContactValues } from "@/lib/contact";

/**
 * Emails a contact letter through Resend. Runs only on the server.
 *
 * Settings (Vercel environment variables):
 * - RESEND_API_KEY      Resend API key with sending access.
 * - CONTACT_TO_EMAIL    Inbox the letters go to. Several can be given, separated by commas.
 * - CONTACT_FROM_EMAIL  Optional sender. Defaults to letters@forms.tygerventures.com, which needs
 *                       the forms.tygerventures.com domain verified in Resend.
 */

type Result = { ok: true } | { ok: false; error: string };

const DEFAULT_FROM = "Tyger Ventures <letters@forms.tygerventures.com>";
const TRY_AGAIN = "That didn't go through. Please try again in a moment.";

// Best-effort limit per visitor: a few letters every ten minutes on each server instance.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const recent = new Map<string, number[]>();

function tooMany(key: string): boolean {
  const now = Date.now();
  const times = (recent.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (times.length >= MAX_PER_WINDOW) {
    recent.set(key, times);
    return true;
  }
  times.push(now);
  if (recent.size > 5000) recent.clear();
  recent.set(key, times);
  return false;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Keeps only the four string fields, trimmed, and refuses anything over its length limit. */
function clean(input: unknown): ContactValues | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;
  const out = {} as ContactValues;
  for (const field of CONTACT_ORDER) {
    const v = raw[field] ?? "";
    if (typeof v !== "string") return null;
    const t = v.trim();
    if (t.length > CONTACT_LIMITS[field]) return null;
    out[field] = t;
  }
  return out;
}

export async function sendContact(input: ContactValues): Promise<Result> {
  const values = clean(input);
  if (!values || Object.keys(validateContact(values)).length > 0) {
    return { ok: false, error: "Something in the letter needs another look." };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = (process.env.CONTACT_TO_EMAIL ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!apiKey || to.length === 0) {
    console.error("Contact form: RESEND_API_KEY or CONTACT_TO_EMAIL is not set.");
    return { ok: false, error: TRY_AGAIN };
  }

  const h = await headers();
  const visitor = h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (tooMany(visitor)) {
    return { ok: false, error: "That's a few letters in a row. Please wait a little and try again." };
  }

  const { name, company, email, message } = values;
  const who = company ? `${name} (${company})` : name;
  const subject = `New letter from ${who}`.replace(/[\r\n]+/g, " ");

  const text = [
    `From: ${name}`,
    company ? `Company: ${company}` : null,
    `Email: ${email}`,
    "",
    message,
    "",
    "Sent from the contact page at tygerventures.com. Reply to this email to answer them.",
  ]
    .filter((line) => line !== null)
    .join("\n");

  const html = `<div style="font-family:Georgia,serif;font-size:16px;line-height:1.55;color:#111">
<p style="margin:0 0 4px"><strong>From:</strong> ${escapeHtml(name)}</p>
${company ? `<p style="margin:0 0 4px"><strong>Company:</strong> ${escapeHtml(company)}</p>` : ""}
<p style="margin:0 0 16px"><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
<div style="white-space:pre-wrap;border-left:3px solid #e0a43a;padding-left:12px">${escapeHtml(message)}</div>
<p style="margin:24px 0 0;font-size:13px;color:#666">Sent from the contact page at tygerventures.com. Reply to this email to answer them.</p>
</div>`;

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: process.env.CONTACT_FROM_EMAIL || DEFAULT_FROM,
      to,
      replyTo: email,
      subject,
      text,
      html,
    });
    if (error) {
      console.error("Contact form: Resend refused the letter.", error.name, error.message);
      return { ok: false, error: TRY_AGAIN };
    }
    return { ok: true };
  } catch (err) {
    console.error("Contact form: sending failed.", err);
    return { ok: false, error: TRY_AGAIN };
  }
}
