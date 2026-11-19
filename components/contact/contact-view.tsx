"use client";

import { useRef } from "react";

import { ContactForm } from "@/components/contact/contact-form";
import { EmberTiger, type EmberTigerHandle } from "@/components/ember-tiger";
import { BlurFade } from "@/components/magicui/blur-fade";
import { site } from "@/lib/site";

/**
 * The contact page body: the ember tiger and slogan beside the form. Typing stirs the tiger,
 * a little heat per keystroke, so a long message builds the embers into flames; sending bursts them.
 */
export function ContactView() {
  const tiger = useRef<EmberTigerHandle>(null);

  return (
    <main className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-[clamp(14px,3vh,36px)] lg:grid-cols-2 lg:grid-rows-1 lg:items-center lg:gap-x-[clamp(40px,6vw,96px)]">
      <section className="flex flex-col items-center gap-[clamp(8px,1.8vh,20px)] text-center lg:items-start lg:text-left">
        <EmberTiger
          ref={tiger}
          className="aspect-[1284/755] w-[min(44vw,200px)] sm:w-[min(40vw,240px)] lg:w-[min(30vw,380px)] [@media(max-height:620px)_and_(max-width:1023px)]:w-[min(30vw,120px)]"
        />
        <BlurFade delay={0.5}>
          <h1 className="contact-title m-0 font-display text-[clamp(28px,min(7.4vw,6.4vh),64px)] leading-[1.04] font-normal tracking-[-0.01em] text-balance italic">
            {site.slogan}
          </h1>
        </BlurFade>
        <BlurFade delay={1.1}>
          <p className="m-0 max-w-[34ch] text-[clamp(14px,1.9vh,16px)] leading-normal text-balance text-dim">
            Tell us what you&apos;re building. We read every note.
          </p>
        </BlurFade>
      </section>

      {/* On short phone screens only this column scrolls, so the tiger above stays put. */}
      <div className="-mx-1 min-h-0 overflow-y-auto overscroll-contain px-1 pt-2 lg:overflow-visible">
        <BlurFade delay={1.3} className="flex justify-center lg:justify-end">
          <ContactForm
            onStir={(amount) => tiger.current?.stir(amount)}
            onSent={(x, y) => {
              tiger.current?.stir(0.6);
              tiger.current?.burst(x, y);
            }}
          />
        </BlurFade>
      </div>
    </main>
  );
}
