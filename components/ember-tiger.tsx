"use client";

import { useEffect, useImperativeHandle, useRef } from "react";

import { createEmberEngine, type EmberEngine } from "@/lib/ember-engine";
import { cn } from "@/lib/utils";

export interface EmberTigerHandle {
  /** Add heat (roughly 0..1). Heat compounds, so repeated calls build from sparks to flames. */
  stir(amount: number): void;
  /** Scatter the particles from a viewport point, or from the tiger's center. */
  burst(x?: number, y?: number): void;
}

interface EmberTigerProps {
  ref?: React.Ref<EmberTigerHandle>;
  /** Sizes the slot the tiger is drawn into. The tiger keeps the logo's proportions inside it. */
  className?: string;
  /** React to pointer movement and taps anywhere on the page. Default true. */
  interactive?: boolean;
  label?: string;
}

/**
 * The Tyger Ventures tiger, drawn as embers. Renders a sized slot in the layout and paints onto a
 * full-viewport canvas behind the page, so particles can scatter beyond the slot.
 */
export function EmberTiger({
  ref,
  className,
  interactive = true,
  label = "Tyger Ventures tiger logo, drawn in embers",
}: EmberTigerProps) {
  const slot = useRef<HTMLDivElement>(null);
  const engine = useRef<EmberEngine | null>(null);

  useEffect(() => {
    const el = slot.current;
    if (!el) return;
    // The canvas lives on <body>, not inside the slot, so an animated ancestor can't trap its fixed positioning.
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;display:block;pointer-events:none;z-index:0";
    document.body.prepend(canvas);
    let e: EmberEngine;
    try {
      e = createEmberEngine(canvas, el, {
        src: "/tiger-logo.svg",
        interactive,
        onHeat: (heat) => el.style.setProperty("--heat", heat.toFixed(3)),
        // The static logo stays until the particles have actually been drawn.
        onReady: () => el.setAttribute("data-live", ""),
      });
    } catch {
      // Setup failed: drop the canvas and leave the static logo in place.
      canvas.remove();
      return;
    }
    engine.current = e;
    return () => {
      e.destroy();
      engine.current = null;
      canvas.remove();
      el.removeAttribute("data-live");
    };
  }, [interactive]);

  useImperativeHandle(
    ref,
    () => ({
      stir: (amount) => engine.current?.stir(amount),
      burst: (x, y) => engine.current?.burst(x, y),
    }),
    [],
  );

  return (
    <div ref={slot} role="img" aria-label={label} className={cn("ember-slot relative", className)}>
      <div className="ember-still" aria-hidden="true" />
      <div className="ember-glow" aria-hidden="true" />
      <div className="ember-blaze" aria-hidden="true" />
    </div>
  );
}
