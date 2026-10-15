"use client";

import { useEffect, useId, useRef, useState } from "react";

import type { Faq } from "@/content/service-faqs";

/** How long the pointer must rest on a question before its answer opens, so sweeping past does not flicker. */
const INTENT_MS = 90;

/**
 * The FAQ list. With a mouse, resting on a question opens its answer and closes the one before; the answer
 * eases open by animating its row height. A click keeps it open. On touch and from the keyboard a question is a
 * button that toggles. Every answer stays in the page, so search engines and screen readers still read all of them.
 */
export default function FaqList({ items }: { items: readonly Faq[] }) {
  const uid = useId();
  const [open, setOpen] = useState<number | null>(0);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const last = useRef({ x: -1, y: -1 });
  const pointer = useRef("mouse");

  useEffect(() => () => clearTimeout(timer.current), []);

  /* Opening one answer moves the questions under the pointer, and the browser reports that as a mouse move. A move
     only counts when the pointer's own position has changed. */
  const rest = (i: number) => (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    if (e.clientX === last.current.x && e.clientY === last.current.y) return;
    last.current = { x: e.clientX, y: e.clientY };
    if (open === i) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(i), INTENT_MS);
  };

  const press = (i: number, e: React.MouseEvent) => {
    clearTimeout(timer.current);
    // A mouse click lands on a question the hover has already opened: keep it open rather than shutting it.
    if (pointer.current === "mouse" && e.detail > 0) setOpen(i);
    else setOpen((o) => (o === i ? null : i));
  };

  return (
    <div className="hm-faq" onPointerLeave={() => clearTimeout(timer.current)}>
      {items.map((f, i) => {
        const isOpen = open === i;
        return (
          // The reveal effect adds its own class to this outer element, so its className must never change: React
          // would write it back over that class and the question would fade out again after the first hover.
          <div key={f.q} data-rv style={{ ["--i" as string]: i }}>
            <div className={isOpen ? "hm-faq-item is-open" : "hm-faq-item"}>
              <button
                type="button"
                className="hm-faq-q"
                id={`${uid}-q${i}`}
                aria-expanded={isOpen}
                aria-controls={`${uid}-a${i}`}
                onPointerDown={(e) => (pointer.current = e.pointerType)}
                onPointerMove={rest(i)}
                onPointerLeave={() => clearTimeout(timer.current)}
                onClick={(e) => press(i, e)}
              >
                <span>{f.q}</span>
                <i aria-hidden="true" />
              </button>
              <div className="hm-faq-a" id={`${uid}-a${i}`} role="region" aria-labelledby={`${uid}-q${i}`}>
                <div>
                  <p>{f.a}</p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
