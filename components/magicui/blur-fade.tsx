import { cn } from "@/lib/utils";

interface BlurFadeProps extends React.ComponentProps<"div"> {
  /** Seconds to wait before the element fades in. */
  delay?: number;
  duration?: number;
  /** Pixels the element travels while fading in. */
  offset?: number;
  blur?: string;
}

/**
 * Magic UI "Blur Fade": content rises into place while un-blurring.
 *
 * Driven by a CSS animation rather than script, so the content still appears if JavaScript is
 * blocked or hydration fails, and it is simply shown as-is when reduced motion is on.
 */
export function BlurFade({
  children,
  className,
  style,
  delay = 0,
  duration = 0.9,
  offset = 10,
  blur = "10px",
  ...props
}: BlurFadeProps) {
  return (
    <div
      className={cn("blur-fade", className)}
      style={
        {
          "--blur-fade-delay": `${delay}s`,
          "--blur-fade-duration": `${duration}s`,
          "--blur-fade-offset": `${offset}px`,
          "--blur-fade-blur": blur,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      {children}
    </div>
  );
}
