"use client";

import { useEffect } from "react";

/**
 * The appear-on-scroll effect: anything marked data-rv starts at opacity ~0 and 10px down, then settles
 * the first time it is 15% in view. Only opacity and transform change. Content stays visible without
 * JavaScript and under reduced motion, because the hidden state only exists once .rv-ready is set here.
 */
export default function Reveal() {
  useEffect(() => {
    const root = document.querySelector(".hm");
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const targets = [...root.querySelectorAll<HTMLElement>("[data-rv]")];
    const below = targets.filter((el) => el.getBoundingClientRect().top > window.innerHeight * 0.9);
    root.classList.add("rv-ready");
    // Anything already on screen stays as it is; only what is still below the fold is animated in.
    const hidden = new Set(below);
    targets.forEach((el) => !hidden.has(el) && el.classList.add("is-in"));

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add("is-in");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    below.forEach((el) => observer.observe(el));
    return () => {
      observer.disconnect();
      root.classList.remove("rv-ready");
    };
  }, []);

  return null;
}
