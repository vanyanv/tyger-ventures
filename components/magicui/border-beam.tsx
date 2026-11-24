"use client";

import { useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

interface BorderBeamProps {
  /** Size of the beam in pixels. */
  size?: number;
  /** Seconds for one lap of the border. */
  duration?: number;
  /** Seconds to offset the start of the animation. */
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
  className?: string;
  style?: React.CSSProperties;
  reverse?: boolean;
  /** Starting position along the border, 0 to 100. */
  initialOffset?: number;
  borderWidth?: number;
}

/**
 * Magic UI "Border Beam": a light that travels along the border of its (relative, rounded) parent.
 *
 * The lap runs as a CSS animation rather than a Motion one. Inside an `AnimatePresence` with
 * `initial={false}` (the contact form), Motion skips a component's first animation and jumps it
 * straight to its end, which left the beam parked at one spot instead of circling.
 */
export function BorderBeam({
  className,
  size = 50,
  delay = 0,
  duration = 6,
  colorFrom = "#ffaa40",
  colorTo = "#9c40ff",
  style,
  reverse = false,
  initialOffset = 0,
  borderWidth = 1,
}: BorderBeamProps) {
  // The beam is decoration only, so with reduced motion it is left out and the plain border remains.
  const reduce = useReducedMotion();
  if (reduce) return null;
  // A negative delay starts the lap part-way round, at `initialOffset` and then `delay` seconds on.
  const start = -(delay + (initialOffset / 100) * duration);
  return (
    <div
      className="pointer-events-none absolute inset-0 rounded-[inherit] border-(length:--border-beam-width) border-transparent [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)] [mask-composite:intersect] [mask-clip:padding-box,border-box]"
      style={{ "--border-beam-width": `${borderWidth}px` } as React.CSSProperties}
    >
      <div
        className={cn(
          "border-beam absolute aspect-square bg-gradient-to-l from-(--color-from) via-(--color-to) to-transparent",
          className,
        )}
        style={
          {
            width: size,
            offsetPath: `rect(0 auto auto 0 round ${size}px)`,
            animationDirection: reverse ? "reverse" : "normal",
            "--beam-duration": `${duration}s`,
            "--beam-delay": `${start}s`,
            "--color-from": colorFrom,
            "--color-to": colorTo,
            ...style,
          } as React.CSSProperties
        }
      />
    </div>
  );
}
