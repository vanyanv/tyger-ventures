import { ContactLink } from "@/components/contact-link";
import { EmberTiger } from "@/components/ember-tiger";
import { BlurFade } from "@/components/magicui/blur-fade";
import { site } from "@/lib/site";

export default function Home() {
  return (
    <div className="screen relative z-10 mx-auto grid h-full max-w-[1272px] touch-pinch-zoom grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden">
      <header className="flex items-center justify-between gap-4">
        <h1 className="label-caps">{site.name}</h1>
        <ContactLink />
      </header>

      {/* The three gaps (header to tiger, tiger to verse, verse to footer) are always equal. */}
      <main className="flex min-h-0 flex-col items-center justify-evenly">
        <EmberTiger className="tiger-home" />

        <figure className="text-center">
          <blockquote className="font-display text-[length:var(--verse)] leading-[1.2] italic">
            {site.verse.map((line, i) => (
              <BlurFade key={line} delay={1.5 + i * 0.28}>
                <span className="verse-burn block" style={{ "--i": i } as React.CSSProperties}>
                  {line}
                </span>
              </BlurFade>
            ))}
          </blockquote>
          <figcaption className="mt-[clamp(6px,1.4vh,14px)] text-[11px] leading-none font-medium tracking-[0.2em] text-dim uppercase [@media(max-height:430px)]:mt-1">
            <BlurFade delay={2.8}>{site.verseCite}</BlurFade>
          </figcaption>
        </figure>
      </main>

      <footer className="text-center text-[11px] leading-[1.3] tracking-[0.04em] text-dim">
        <p>{site.legal}</p>
      </footer>
    </div>
  );
}
