// Shared contact form rules, used by the form (instant feedback) and the server action (the real check).

export type ContactField = "name" | "email" | "company" | "message";

export type ContactInput = Record<ContactField, string> & {
  /** Honeypot. People never see it, so anything here means a bot. */
  website?: string;
  /** Epoch ms when the form was rendered, for a minimum fill time. */
  startedAt?: number;
};

export type ContactResult =
  | { ok: true }
  | { ok: false; error: string; field?: ContactField };

export const CONTACT_LIMITS: Record<ContactField, number> = {
  name: 120,
  email: 200,
  company: 160,
  message: 5000,
};

export const MIN_MESSAGE_LENGTH = 10;
export const MIN_FILL_MS = 2500;

const EMAIL_RE = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]{2,}$/;

export function cleanContact(input: Partial<ContactInput>): ContactInput {
  const clean = (v: unknown, max: number) =>
    String(v ?? "").replace(/\r\n?/g, "\n").trim().slice(0, max);
  return {
    name: clean(input.name, CONTACT_LIMITS.name),
    email: clean(input.email, CONTACT_LIMITS.email),
    company: clean(input.company, CONTACT_LIMITS.company),
    message: clean(input.message, CONTACT_LIMITS.message),
    website: clean(input.website, 200),
    startedAt: Number(input.startedAt) || undefined,
  };
}

/** Returns the first problem, or null when the submission is fine. */
export function validateContact(f: ContactInput): Extract<ContactResult, { ok: false }> | null {
  if (!f.name) return { ok: false, field: "name", error: "Please add your name." };
  if (!EMAIL_RE.test(f.email)) return { ok: false, field: "email", error: "Please check your email address." };
  if (f.message.length < MIN_MESSAGE_LENGTH) return { ok: false, field: "message", error: "Tell us a little more." };
  return null;
}

export function looksLikeSpam(f: ContactInput, now = Date.now()): boolean {
  if (f.website) return true;
  return !!f.startedAt && now - f.startedAt < MIN_FILL_MS;
}
