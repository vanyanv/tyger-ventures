/** The contact letter: its fields, limits and validation. Sending lives in lib/send-contact.ts. */

export type ContactField = "name" | "company" | "email" | "message";
export type ContactValues = Record<ContactField, string>;
export type ContactErrors = Partial<Record<ContactField, string>>;

export const EMPTY_CONTACT: ContactValues = { name: "", company: "", email: "", message: "" };

export const CONTACT_LIMITS: Record<ContactField, number> = {
  name: 80,
  company: 100,
  email: 254,
  message: 2000,
};

/** Order the fields appear in, used to focus the first one that needs fixing. */
export const CONTACT_ORDER: ContactField[] = ["name", "company", "email", "message"];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isFilled(field: ContactField, value: string): boolean {
  const v = value.trim();
  if (field === "email") return EMAIL.test(v);
  return v.length > 0;
}

export function validateContact(values: ContactValues): ContactErrors {
  const errors: ContactErrors = {};
  if (!values.name.trim()) errors.name = "Add your name.";
  if (!values.email.trim()) errors.email = "Add an email so we can reply.";
  else if (!EMAIL.test(values.email.trim())) errors.email = "That email doesn't look right.";
  if (!values.message.trim()) errors.message = "Tell us a little about the idea.";
  return errors;
}

/**
 * How brightly the tiger should burn for a letter in this state, 0..1.
 * Each finished blank adds heat, and the message adds more the longer it gets.
 */
export function letterHeat(values: ContactValues): number {
  const words = Math.min(1, values.message.trim().length / 120);
  return (
    (isFilled("name", values.name) ? 0.09 : 0) +
    (isFilled("company", values.company) ? 0.04 : 0) +
    (isFilled("email", values.email) ? 0.09 : 0) +
    words * 0.16
  );
}
