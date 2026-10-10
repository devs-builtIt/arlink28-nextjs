"use client";

import { useEffect, useState } from "react";

type Item = { id: string; label: string };

/**
 * The "on this page" list for a legal document. The section being read is marked as you scroll. On a narrow screen
 * the list starts closed so it does not push the text down.
 */
export default function LegalToc({ items }: { items: Item[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setOpen(window.matchMedia("(min-width: 901px)").matches);
  }, []);

  useEffect(() => {
    const headings = items.map((i) => document.getElementById(i.id)).filter((h): h is HTMLElement => !!h);
    if (headings.length === 0) return;
    const onScroll = () => {
      // The last heading that has passed a line a little below the header is the one being read.
      const line = 140;
      let current = headings[0].id;
      for (const h of headings) {
        if (h.getBoundingClientRect().top - line <= 0) current = h.id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [items]);

  return (
    <details className="lg-toc" open={open} onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}>
      <summary>On this page</summary>
      <ul>
        {items.map((i) => (
          <li key={i.id}>
            <a href={`#${i.id}`} aria-current={active === i.id ? "location" : undefined}>
              {i.label}
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}
