"use server";

import { cleanContact, looksLikeSpam, validateContact, type ContactInput, type ContactResult } from "@/lib/contact";

/**
 * Receives a contact form submission.
 *
 * Delivery is not wired up yet: valid submissions are accepted and logged on the server only.
 * To send them by email, replace `deliver` below (for example with Resend: POST https://api.resend.com/emails
 * using RESEND_API_KEY, a verified sender, the recipient inbox, and reply_to set to the visitor's email).
 */
export async function sendContact(input: Partial<ContactInput>): Promise<ContactResult> {
  const f = cleanContact(input);
  if (looksLikeSpam(f)) return { ok: true }; // look successful, send nothing

  const problem = validateContact(f);
  if (problem) return problem;

  try {
    await deliver(f);
    return { ok: true };
  } catch (err) {
    console.error("[contact] delivery failed", err);
    return { ok: false, error: "Something went wrong sending that. Please try again." };
  }
}

async function deliver(f: ContactInput): Promise<void> {
  // TODO: send through the email provider once the recipient inbox is chosen.
  console.info("[contact] new submission (not delivered yet)", {
    name: f.name,
    company: f.company || undefined,
    messageLength: f.message.length,
  });
}
