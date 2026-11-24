import type { Metadata } from "next";
import Link from "next/link";

import { ContactLetter } from "@/components/contact/contact-letter";
import { ViewportFit } from "@/components/contact/viewport-fit";
import { BorderBeam } from "@/components/magicui/border-beam";
import { site } from "@/lib/site";

import "./contact.css";

export const metadata: Metadata = {
  title: "Contact",
  description: `Write to ${site.name}.`,
};

export default function ContactPage() {
  return (
    <div className="screen contact-screen relative z-10 mx-auto grid h-full max-w-[1272px] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden">
      <ViewportFit />
      <header className="flex items-center justify-between gap-4">
        <Link
          href="/"
          className="label-caps rounded-sm text-bone focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ember"
        >
          {site.name}
        </Link>
        <Link
          href="/"
          className="group relative inline-flex items-center gap-2 rounded-full border border-line bg-bone/5 px-[18px] py-2.5 text-[13px] leading-none font-medium tracking-[0.02em] text-bone transition-colors duration-300 hover:bg-ember/15 hover:text-hot focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ember"
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 11 11"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            aria-hidden="true"
            className="transition-transform duration-300 group-hover:-translate-x-0.5"
          >
            <path d="M10 5.5H1.5M5 2 1.5 5.5 5 9" />
          </svg>
          Home
          <BorderBeam size={44} duration={4} colorFrom="var(--color-hot)" colorTo="var(--color-ember)" />
        </Link>
      </header>

      <ContactLetter />

      <footer className="contact-footer text-center text-[11px] leading-[1.3] tracking-[0.04em] text-dim">
        <p>{site.legal}</p>
      </footer>
    </div>
  );
}
