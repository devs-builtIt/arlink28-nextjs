"use client";

import { useEffect, useRef } from "react";

type Item = { src: string; alt: string; caption: string; rotate: number };

/**
 * Photos that split open as you scroll. They start stacked in the middle and, as the row scrolls up the
 * screen, slide apart and tilt into their places. The scroll position is written to one CSS variable (--p,
 * 0 to 1) and the stylesheet turns it into transforms, so only transform changes while scrolling.
 * Without JavaScript, on a phone, or under reduced motion the photos simply sit in their final places.
 */
export default function StoryCollage({ items }: { items: Item[] }) {
  const ref = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const wide = window.matchMedia("(min-width: 641px)");
    if (reduced.matches || !wide.matches) return;

    const update = () => {
      const vh = window.innerHeight;
      const top = el.getBoundingClientRect().top;
      // 0 while the row is still low on the screen, 1 once it has reached about a third of the way up.
      const raw = (vh * 0.95 - top) / (vh * 0.62);
      const t = Math.min(1, Math.max(0, raw));
      const eased = 1 - Math.pow(1 - t, 3);
      el.style.setProperty("--p", eased.toFixed(3));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const mid = (items.length - 1) / 2;
  return (
    <ul className="hm-collage" ref={ref}>
      {items.map((c, i) => (
        <li
          key={c.src}
          style={{ ["--r" as string]: `${c.rotate}deg`, ["--k" as string]: i - mid, zIndex: i % 2 ? 2 : 1 }}
        >
          <figure>
            <img src={c.src} alt={c.alt} loading="lazy" decoding="async" width={900} height={1200} />
            <figcaption>{c.caption}</figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}
