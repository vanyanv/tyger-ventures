"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";

interface BlurFadeProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: React.ReactNode;
  /** Seconds to wait before the element fades in. */
  delay?: number;
  duration?: number;
  /** Pixels the element travels while fading in. */
  offset?: number;
  blur?: string;
}

/** Magic UI "Blur Fade": content rises into place while un-blurring. */
export function BlurFade({
  children,
  delay = 0,
  duration = 0.9,
  offset = 10,
  blur = "10px",
  ...props
}: BlurFadeProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: offset, filter: `blur(${blur})` }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ delay, duration, ease: [0.2, 0.7, 0.2, 1] }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
