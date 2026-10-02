"use client";

import { useEffect, useRef, useState } from "react";

const WORD = "ARLink28";

/**
 * The oversized wordmark at the foot of the page. It is a watermark: drawn faint, fading toward the bottom,
 * and each letter rises into place once as the footer scrolls into view. Under reduced motion it just shows.
 */
export default function FooterMark() {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setSeen(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`sf-mark${seen ? " is-in" : ""}`} ref={ref} aria-hidden="true">
      {WORD.split("").map((ch, i) => (
        <span key={i} style={{ ["--i" as string]: i }}>
          {ch}
        </span>
      ))}
    </div>
  );
}
