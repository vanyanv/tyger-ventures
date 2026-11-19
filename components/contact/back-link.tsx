import Link from "next/link";

import { BorderBeam } from "@/components/magicui/border-beam";

/** Header pill that returns to the home page, styled like the home page's Contact link. */
export function BackLink() {
  return (
    <Link
      href="/"
      className="group relative inline-flex items-center gap-2 rounded-full border border-line bg-bone/5 px-[18px] py-2.5 text-[13px] leading-none font-medium tracking-[0.02em] text-bone transition-colors duration-300 hover:bg-ember/15 hover:text-hot focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ember"
    >
      <svg
        width="12"
        height="10"
        viewBox="0 0 12 10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        aria-hidden="true"
        className="transition-transform duration-300 group-hover:-translate-x-0.5"
      >
        <path d="M11 5H1.5M5 1 1 5l4 4" />
      </svg>
      Back
      <BorderBeam size={44} duration={4} colorFrom="var(--color-hot)" colorTo="var(--color-ember)" />
    </Link>
  );
}
