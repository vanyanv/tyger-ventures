import type { Metadata } from "next";
import Link from "next/link";

import { BackLink } from "@/components/contact/back-link";
import { ContactView } from "@/components/contact/contact-view";
import { site } from "@/lib/site";

import "./contact.css";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with ${site.name}. ${site.slogan}.`,
};

export default function ContactPage() {
  return (
    <div className="screen relative z-10 mx-auto grid h-full max-w-[1272px] grid-rows-[auto_minmax(0,1fr)_auto] gap-[clamp(14px,2.6vh,28px)] overflow-hidden">
      <header className="flex items-center justify-between gap-4">
        <Link
          href="/"
          className="label-caps text-bone no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ember"
        >
          {site.name}
        </Link>
        <BackLink />
      </header>

      <ContactView />

      <footer className="text-center text-[11px] leading-[1.3] tracking-[0.04em] text-dim lg:text-right">
        <p>{site.legal}</p>
      </footer>
    </div>
  );
}
