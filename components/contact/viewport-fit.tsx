"use client";

import { useEffect } from "react";

/** Below this much visible height on a phone-width screen, the keyboard is taken to be up. */
const COMPACT_HEIGHT = 480;
const PHONE_WIDTH = 600;

/**
 * Keeps the contact screen inside the part of the window that is actually visible.
 *
 * A phone keyboard covers the lower half of the page. Some browsers shrink the page to fit, others
 * (iOS Safari) leave the page full height and slide it around instead. Either way this sizes the
 * screen to the visible area, flags the compact layout, and keeps the focused field in view, so
 * every field and the Send button can be reached by scrolling the letter.
 */
export function ViewportFit() {
  useEffect(() => {
    const root = document.documentElement;
    const vv = window.visualViewport;
    let frame = 0;

    function fit() {
      const height = vv ? vv.height : window.innerHeight;
      const compact = height < COMPACT_HEIGHT && window.innerWidth < PHONE_WIDTH;
      // Only override the CSS height when the visible area is smaller than the page (keyboard up).
      const covered = vv ? window.innerHeight - vv.height > 80 : false;
      if (covered) {
        root.style.setProperty("--contact-h", `${Math.round(height)}px`);
        // Where the visible area starts in the document, less where the screen itself starts. This
        // holds whether the browser slid the visual viewport, scrolled the page, or did both.
        const screen = document.querySelector<HTMLElement>(".contact-screen");
        const top = Math.max(0, vv!.pageTop - (screen?.offsetTop ?? 0));
        root.style.setProperty("--contact-top", `${Math.round(top)}px`);
      } else {
        root.style.removeProperty("--contact-h");
        root.style.removeProperty("--contact-top");
      }
      root.toggleAttribute("data-contact-compact", compact);

      const field = document.activeElement;
      if (compact && field instanceof HTMLElement && field.closest(".letter-body")) {
        field.scrollIntoView({ block: "nearest" });
      }
    }
    function schedule() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fit);
    }

    fit();
    vv?.addEventListener("resize", schedule);
    vv?.addEventListener("scroll", schedule);
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, { passive: true });
    document.addEventListener("focusin", schedule);
    return () => {
      cancelAnimationFrame(frame);
      vv?.removeEventListener("resize", schedule);
      vv?.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule);
      document.removeEventListener("focusin", schedule);
      root.style.removeProperty("--contact-h");
      root.style.removeProperty("--contact-top");
      root.removeAttribute("data-contact-compact");
    };
  }, []);

  return null;
}
