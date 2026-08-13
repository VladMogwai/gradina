"use client";

import { usePrefersReducedMotion } from "../lib/usePrefersReducedMotion";

interface BackgroundVideoProps {
  className?: string;
}

// The site's one garden video/poster pair, rendered as a muted looping
// background - falls back to the poster image when the user prefers
// reduced motion (or if autoplay is ever blocked, via the video's own
// poster attribute).
export function BackgroundVideo({ className }: BackgroundVideoProps) {
  const reducedMotion = usePrefersReducedMotion();

  if (reducedMotion) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src="/landing/hero-poster.jpg" alt="" className={className} />;
  }

  return (
    <video autoPlay muted loop playsInline poster="/landing/hero-poster.jpg" className={className}>
      <source src="/landing/hero.mp4" type="video/mp4" />
    </video>
  );
}
