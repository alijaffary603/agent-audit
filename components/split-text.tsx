"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText as GSAPSplitText } from "gsap/SplitText";
import { useRef, type CSSProperties } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger, GSAPSplitText);

/** Tags this component is allowed to render, so the DOM stays predictable. */
type SplitTextTag = "h1" | "h2" | "h3" | "h4" | "p" | "span";

type SplitTextVariant = "chars" | "words" | "lines" | "words, chars";

export type SplitTextProps = {
  text: string;
  tag?: SplitTextTag;
  className?: string;
  /** Stagger between fragments, in milliseconds. */
  delay?: number;
  /** Duration of each fragment's tween, in seconds. */
  duration?: number;
  ease?: string | ((progress: number) => number);
  splitType?: SplitTextVariant;
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
  /** Fraction of the element that must be in view before animating. */
  threshold?: number;
  /** Extra offset applied to the trigger position, in pixels. */
  rootMargin?: number;
  textAlign?: CSSProperties["textAlign"];
  onLetterAnimationComplete?: () => void;
};

/**
 * Animates a single line of text in fragments, once, when it scrolls into view.
 *
 * Accessibility is deliberately independent of the animation: the rendered tag
 * carries the complete sentence as its accessible name and the visible text is
 * hidden from assistive technology, so the split fragments are never announced
 * and the heading reads correctly before, during, and after the tween — and
 * equally if GSAP never runs at all.
 */
export function SplitText({
  text,
  tag: Tag = "p",
  className,
  delay = 80,
  duration = 0.7,
  ease = "power3.out",
  splitType = "words",
  from = { opacity: 0, y: 28 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = 0,
  textAlign,
  onLetterAnimationComplete,
}: SplitTextProps) {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    (_context, contextSafe) => {
      const container = containerRef.current;
      if (container === null || contextSafe === undefined) return;

      // Reduced motion keeps the fully rendered heading and never splits it.
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const target = container.querySelector<HTMLElement>("[data-split-text]");
      if (target === null) return;

      let cancelled = false;
      let split: GSAPSplitText | null = null;
      let tween: gsap.core.Tween | null = null;

      const build = contextSafe(() => {
        if (cancelled) return;

        try {
          split = new GSAPSplitText(target, {
            type: splitType,
            // This component owns the ARIA contract; SplitText must not add
            // labels of its own on top of it.
            aria: "none",
          });
        } catch {
          // Splitting failed: the plain text is already on screen.
          return;
        }

        const fragments = splitType.includes("chars")
          ? split.chars
          : splitType.includes("words")
            ? split.words
            : split.lines;
        if (fragments.length === 0) return;

        tween = gsap.fromTo(fragments, from, {
          ...to,
          duration,
          ease,
          stagger: delay / 1000,
          force3D: true,
          scrollTrigger: {
            trigger: container,
            start: `top ${(1 - threshold) * 100}%+=${rootMargin}px`,
            // Fires a single time, then the trigger retires itself.
            once: true,
          },
          onComplete: () => {
            tween?.scrollTrigger?.kill();
            onLetterAnimationComplete?.();
          },
        });
      });

      // Splitting before webfonts settle measures the wrong glyph widths, but
      // waiting must never gate the text being on screen.
      const fonts = document.fonts;
      if (fonts === undefined || fonts.status === "loaded") build();
      else fonts.ready.then(build).catch(build);

      return () => {
        cancelled = true;
        // Only this heading's trigger is killed; others on the page are left
        // untouched.
        tween?.scrollTrigger?.kill();
        tween?.kill();
        split?.revert();
      };
    },
    { scope: containerRef, dependencies: [] },
  );

  return (
    <Tag
      ref={containerRef as React.RefObject<never>}
      className={className}
      style={textAlign === undefined ? undefined : { textAlign }}
      aria-label={text}
    >
      {/* The visible copy is decorative once the tag is labelled: the split
          fragments must never be announced one by one. */}
      <span data-split-text aria-hidden="true">
        {text}
      </span>
    </Tag>
  );
}
