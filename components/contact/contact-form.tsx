"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { sendContact } from "@/app/contact/actions";
import { BorderBeam } from "@/components/magicui/border-beam";
import { CONTACT_LIMITS, cleanContact, validateContact, type ContactField } from "@/lib/contact";
import { cn } from "@/lib/utils";

type Props = {
  /** Called on every keystroke with a small amount of heat, so writing slowly builds the embers into flames. */
  onStir?: (amount: number) => void;
  /** Called once the message is accepted, with the centre of the send button. */
  onSent?: (x: number, y: number) => void;
  className?: string;
};

const EASE = [0.2, 0.7, 0.2, 1] as const;

export function ContactForm({ onStir, onSent, className }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const startedAt = useRef(0);
  const [bad, setBad] = useState<ContactField | null>(null);
  const [status, setStatus] = useState<{ text: string; error?: boolean } | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();
  const reduce = useReducedMotion();

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  function flag(field: ContactField, text: string) {
    setBad(field);
    setStatus({ text, error: true });
    formRef.current?.querySelector<HTMLElement>(`[name="${field}"]`)?.focus();
  }

  function handleInput(e: FormEvent<HTMLFormElement>) {
    const el = e.target as HTMLInputElement | HTMLTextAreaElement;
    if (bad === el.name) {
      setBad(null);
      setStatus(null);
    }
    onStir?.(0.05);
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const input = cleanContact({ ...data, startedAt: startedAt.current });
    const problem = validateContact(input);
    if (problem) return flag(problem.field!, problem.error);

    setStatus(null);
    startTransition(async () => {
      try {
        const res = await sendContact(input);
        if (!res.ok) {
          if (res.field) flag(res.field, res.error);
          else setStatus({ text: res.error, error: true });
          return;
        }
        const r = buttonRef.current?.getBoundingClientRect();
        if (r) onSent?.(r.left + r.width / 2, r.top + r.height / 2);
        await new Promise((ok) => setTimeout(ok, reduce ? 0 : 450));
        setSent(true);
      } catch {
        setStatus({ text: "Could not reach the server. Check your connection and try again.", error: true });
      }
    });
  }

  return (
    <div className={cn("relative w-full max-w-[560px]", className)}>
      <AnimatePresence mode="wait" initial={false}>
        {!sent ? (
          <motion.form
            key="form"
            ref={formRef}
            noValidate
            onInput={handleInput}
            onSubmit={handleSubmit}
            exit={{ opacity: 0, filter: "blur(8px)", y: -8 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="grid gap-[clamp(14px,2.4vh,22px)]"
          >
            <div className="grid gap-[inherit] sm:grid-cols-2 sm:gap-x-7">
              <Field name="name" label="Name" autoComplete="name" bad={bad === "name"} />
              <Field name="email" label="Email" type="email" inputMode="email" autoComplete="email" bad={bad === "email"} />
            </div>
            <Field name="company" label="Company" optional autoComplete="organization" bad={bad === "company"} />
            <Field name="message" label="What's the idea?" multiline bad={bad === "message"} />

            {/* Honeypot, hidden from people and assistive tech. */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label htmlFor="website">Website</label>
              <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
            </div>

            <div className="mt-1 flex flex-wrap items-center justify-between gap-4">
              <p
                role="status"
                aria-live="polite"
                className={cn("m-0 min-h-[1.4em] flex-[1_1_180px] text-[13px] leading-snug text-dim", status?.error && "text-[#ff7a5c]")}
              >
                {status?.text}
              </p>
              <button
                ref={buttonRef}
                type="submit"
                disabled={pending}
                className="relative inline-flex min-w-[132px] items-center justify-center gap-2 rounded-full border border-line bg-bone/5 px-[26px] py-[14px] text-sm leading-none font-medium tracking-[0.02em] text-bone transition-colors duration-300 hover:bg-ember/15 hover:text-hot focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ember disabled:cursor-progress"
              >
                <span>{pending ? "Sending" : "Send"}</span>
                <i aria-hidden="true" className="ember-dot" />
                <BorderBeam size={52} duration={pending ? 1.2 : 4} colorFrom="var(--color-hot)" colorTo="var(--color-ember)" />
              </button>
            </div>
          </motion.form>
        ) : (
          <motion.div
            key="done"
            // Move focus to the confirmation so screen readers announce it.
            ref={(el) => el?.focus({ preventScroll: true })}
            tabIndex={-1}
            initial={{ opacity: 0, filter: "blur(10px)", y: 12 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.1 }}
            className="grid min-h-[300px] place-content-center justify-items-center gap-3.5 text-center outline-none"
          >
            <h2 className="m-0 font-display text-[clamp(28px,5vh,44px)] italic leading-tight font-normal">Message received.</h2>
            <p className="m-0 text-[15px] text-dim">Thank you. We&apos;ll be in touch.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type FieldProps = {
  name: ContactField;
  label: string;
  type?: string;
  inputMode?: "email" | "text";
  autoComplete?: string;
  optional?: boolean;
  multiline?: boolean;
  bad?: boolean;
};

function Field({ name, label, type = "text", inputMode, autoComplete, optional, multiline, bad }: FieldProps) {
  const common = {
    id: name,
    name,
    placeholder: " ",
    maxLength: CONTACT_LIMITS[name],
    required: !optional,
    "aria-invalid": bad || undefined,
    className: "peer contact-input",
  };
  return (
    <div className={cn("contact-field", bad && "is-bad")}>
      {multiline ? (
        <textarea {...common} rows={3} />
      ) : (
        <input {...common} type={type} inputMode={inputMode} autoComplete={autoComplete} />
      )}
      <label htmlFor={name} className="contact-label">
        {label}
        {optional && <small className="ml-1 text-[0.8em] opacity-70 normal-case tracking-normal">(optional)</small>}
      </label>
    </div>
  );
}
