"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { EmberTiger, type EmberTigerHandle } from "@/components/ember-tiger";
import { BlurFade } from "@/components/magicui/blur-fade";
import { BorderBeam } from "@/components/magicui/border-beam";
import {
  CONTACT_LIMITS,
  CONTACT_ORDER,
  EMPTY_CONTACT,
  isFilled,
  letterHeat,
  validateContact,
  type ContactErrors,
  type ContactField,
  type ContactValues,
} from "@/lib/contact";
import { sendContact } from "@/lib/send-contact";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

/** idle: writing. sending: waiting on delivery. burning: the letter burns away. sent: confirmation. */
type Phase = "idle" | "sending" | "burning" | "sent";

const BURN_MS = 1150;

/**
 * The contact page body: a short letter with blanks to fill in, under the ember tiger.
 * The tiger is the progress bar. Every finished blank raises its resting heat, so a complete
 * letter leaves it in flames, and sending burns the letter away and sets the whole tiger ablaze.
 */
export function ContactLetter() {
  const tiger = useRef<EmberTigerHandle>(null);
  const form = useRef<HTMLFormElement>(null);
  const statusId = useId();
  const reduce = useReducedMotion();

  const [values, setValues] = useState<ContactValues>(EMPTY_CONTACT);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");

  const busy = phase !== "idle";
  const ready = Object.keys(validateContact(values)).length === 0;
  const firstError = CONTACT_ORDER.map((f) => errors[f]).find(Boolean) ?? notice;

  // The tiger rests at the letter's heat, and keeps burning once the note is away.
  useEffect(() => {
    tiger.current?.setFloor(phase === "sent" ? 0.3 : letterHeat(values));
  }, [values, phase]);

  function change(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const field = e.target.name as ContactField;
    const value = e.target.value;
    // A blank catching light gives the tiger a kick; ordinary keystrokes just stir it.
    const lit = field !== "message" && !isFilled(field, values[field]) && isFilled(field, value);
    tiger.current?.stir(lit ? 0.14 : 0.012);
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    setNotice(null);
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const problems = validateContact(values);
    const firstBad = CONTACT_ORDER.find((f) => problems[f]);
    if (firstBad) {
      setErrors(problems);
      form.current?.querySelector<HTMLElement>(`[name="${firstBad}"]`)?.focus();
      return;
    }

    setPhase("sending");
    const result = await sendContact({
      name: values.name.trim(),
      company: values.company.trim(),
      email: values.email.trim(),
      message: values.message.trim(),
    }).catch(() => ({ ok: false as const, error: "That didn't go through. Check your connection and try again." }));
    if (!result.ok) {
      setNotice(result.error);
      setPhase("idle");
      return;
    }

    // Put the phone keyboard away so the burn and the thank-you get the whole screen.
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    setPhase("burning");
    tiger.current?.stir(1);
    window.setTimeout(() => setPhase("sent"), reduce ? 0 : BURN_MS);
  }

  /** Return on a one-line blank moves to the next field, so the phone keyboard's key never sends early. */
  function nextOnEnter(e: KeyboardEvent<HTMLInputElement>) {
    // keyCode 229: Safari reports the Return that confirms IME text with isComposing already false.
    if (e.key !== "Enter" || e.nativeEvent.isComposing || e.nativeEvent.keyCode === 229) return;
    e.preventDefault();
    const next = CONTACT_ORDER[CONTACT_ORDER.indexOf(e.currentTarget.name as ContactField) + 1];
    form.current?.querySelector<HTMLElement>(`[name="${next}"]`)?.focus();
  }

  function sendOnShortcut(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      form.current?.requestSubmit();
    }
  }

  function writeAnother() {
    setValues(EMPTY_CONTACT);
    setErrors({});
    setNotice(null);
    setPhase("idle");
  }

  const blank = (field: ContactField) => ({
    name: field,
    value: values[field],
    readOnly: busy,
    maxLength: CONTACT_LIMITS[field],
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": errors[field] ? statusId : undefined,
  });
  const left = CONTACT_LIMITS.message - values.message.length;
  const firstName = values.name.trim().split(/\s+/)[0];

  return (
    <main className="letter-main">
      <h1 className="sr-only">Contact {site.name}</h1>

      <div className="letter-top">
        <EmberTiger ref={tiger} className="tiger-contact" flameScale={0.62} />
      </div>

      <div className="letter-body">
        <AnimatePresence mode="wait" initial={false}>
          {phase !== "sent" ? (
            <motion.form
              key="letter"
              ref={form}
              noValidate
              onSubmit={submit}
              aria-busy={busy}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={cn("letter-form", phase === "burning" && "is-burning")}
            >
              <BlurFade delay={0.7} className="letter-pair">
                <Blank lead="I’m" lit={isFilled("name", values.name)} bad={!!errors.name}>
                  <input
                    {...blank("name")}
                    onChange={change}
                    type="text"
                    aria-label="Your name"
                    placeholder="your name"
                    autoComplete="name"
                    autoCapitalize="words"
                    enterKeyHint="next"
                    onKeyDown={nextOnEnter}
                    required
                    className="blank-input"
                  />
                </Blank>
                <Blank lead="from" lit={isFilled("company", values.company)} bad={!!errors.company}>
                  <input
                    {...blank("company")}
                    onChange={change}
                    type="text"
                    aria-label="Company (optional)"
                    placeholder="company, if any"
                    autoComplete="organization"
                    enterKeyHint="next"
                    onKeyDown={nextOnEnter}
                    className="blank-input"
                  />
                </Blank>
              </BlurFade>

              <BlurFade delay={0.9}>
                <Blank lead="Reach me at" lit={isFilled("email", values.email)} bad={!!errors.email}>
                  <input
                    {...blank("email")}
                    onChange={change}
                    type="email"
                    inputMode="email"
                    aria-label="Your email"
                    placeholder="you@email.com"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    enterKeyHint="next"
                    onKeyDown={nextOnEnter}
                    required
                    className="blank-input"
                  />
                </Blank>
              </BlurFade>

              <BlurFade delay={1.1} className="letter-note">
                <label htmlFor="contact-message" className="blank-lead">
                  Here’s the idea:
                </label>
                <div className={cn("note", errors.message && "is-bad")}>
                  <textarea
                    {...blank("message")}
                    onChange={change}
                    id="contact-message"
                    placeholder="What are you building, and what do you need?"
                    onKeyDown={sendOnShortcut}
                    required
                    className="note-input"
                  />
                  {left <= 200 && (
                    <span className="note-count" aria-hidden="true">
                      {left}
                    </span>
                  )}
                  <div className="note-beam" aria-hidden="true">
                    <BorderBeam size={90} duration={7} colorFrom="var(--color-hot)" colorTo="var(--color-ember)" />
                  </div>
                </div>
              </BlurFade>

              <BlurFade delay={1.3} className="letter-send">
                <p id={statusId} role="status" aria-live="polite" className="letter-status">
                  {firstError}
                </p>
                <button type="submit" disabled={busy} className={cn("send", ready && "is-ready")}>
                  <span>{phase === "idle" ? "Send" : "Sending"}</span>
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
                    <path d="M2 9 9 2M3.5 2H9v5.5" />
                  </svg>
                  <BorderBeam
                    size={52}
                    duration={busy ? 1.1 : ready ? 2.4 : 4}
                    colorFrom="var(--color-hot)"
                    colorTo="var(--color-ember)"
                  />
                </button>
              </BlurFade>
            </motion.form>
          ) : (
            // A CSS entrance, not a scripted one: once it ends no filter or transform is left on the
            // block, which Safari needs to paint the clipped-gradient title in full.
            <BlurFade
              key="sent"
              // Move focus to the confirmation so it is announced.
              ref={(el) => el?.focus({ preventScroll: true })}
              tabIndex={-1}
              delay={0.25}
              duration={1}
              offset={14}
              className="letter-done"
            >
              <h2 className="letter-done-title">
                <span className="verse-burn block" style={{ "--i": -6 } as React.CSSProperties}>
                  Burning bright.
                </span>
              </h2>
              <p className="letter-done-copy">
                Thank you{firstName ? `, ${firstName}` : ""}. Your note is in, and we’ll be in touch.
              </p>
              <button type="button" onClick={writeAnother} className="letter-again">
                Write another
              </button>
            </BlurFade>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

interface BlankProps {
  /** The words of the sentence that lead into the blank. */
  lead: string;
  lit: boolean;
  bad: boolean;
  children: React.ReactNode;
}

/** One blank in the letter: lead-in words, then a field on an underline that lights when filled. */
function Blank({ lead, lit, bad, children }: BlankProps) {
  return (
    <label className={cn("blank", lit && "is-lit", bad && "is-bad")}>
      <span className="blank-lead">{lead}</span>
      <span className="blank-well">
        {children}
        <i className="blank-line" aria-hidden="true" />
      </span>
    </label>
  );
}
