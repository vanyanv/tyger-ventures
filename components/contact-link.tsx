import Link from "next/link";

import { BorderBeam } from "@/components/magicui/border-beam";
import { site } from "@/lib/site";

/** Pill link in the header, with a beam of ember light circling its border. */
export function ContactLink() {
  const external = site.contactHref.startsWith("http");
  return (
    <Link
      href={site.contactHref}
      {...(external ? { target: "_blank", rel: "noopener" } : {})}
      className="group relative inline-flex items-center gap-2 rounded-full border border-line bg-bone/5 px-[18px] py-2.5 text-[13px] leading-none font-medium tracking-[0.02em] text-bone transition-colors duration-300 hover:bg-ember/15 hover:text-hot focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ember"
    >
      Contact
      <svg
        width="11"
        height="11"
        viewBox="0 0 11 11"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        aria-hidden="true"
        className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
      >
        <path d="M2 9 9 2M3.5 2H9v5.5" />
      </svg>
      <BorderBeam size={44} duration={4} colorFrom="var(--color-hot)" colorTo="var(--color-ember)" />
    </Link>
  );
}
