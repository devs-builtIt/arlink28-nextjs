"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

export type HoverItem = { title: string; text: string; src: string; pos?: string };

/**
 * A numbered list with a photo beside it. Hovering (or tabbing to) a row slides the highlight to it, nudges
 * its number and arrow, and cross-fades the photo. The optional link sits under the list; children render
 * below the whole block.
 */
export default function HoverList({
  items,
  cta,
  children,
}: {
  items: readonly HoverItem[];
  cta?: { href: string; label: string };
  children?: ReactNode;
}) {
  const [active, setActive] = useState(0);
  const [engaged, setEngaged] = useState(false);
  const list = useRef<HTMLUListElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  /* One highlight slides between rows rather than each row filling on its own, so the move reads as a single motion. */
  useLayoutEffect(() => {
    const ul = list.current;
    const el = ul?.children[active + 1] as HTMLElement | undefined;
    if (!ul || !el || !bar.current) return;
    const place = () => {
      bar.current!.style.transform = `translateY(${el.offsetTop}px)`;
      bar.current!.style.height = `${el.offsetHeight}px`;
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(ul);
    return () => ro.disconnect();
  }, [active]);

  return (
    <>
      <div className="hm-how">
        <div className="hm-how-photo" data-rv>
          {items.map((p, i) => (
            <img
              key={p.src}
              src={p.src}
              alt=""
              loading={i === 0 ? "eager" : "lazy"}
              decoding="async"
              width={800}
              height={1000}
              style={{ objectPosition: p.pos ?? "50% 50%" }}
              className={i === active ? "is-on" : undefined}
            />
          ))}
        </div>
        <div className="hm-why-side">
          <ul
            ref={list}
            className={engaged ? "hm-why-list is-engaged" : "hm-why-list"}
            onMouseLeave={() => setEngaged(false)}
            onBlur={() => setEngaged(false)}
          >
            <span ref={bar} className="hm-why-bar" aria-hidden="true" />
            {items.map((w, i) => (
              <li
                key={w.title}
                tabIndex={0}
                className={engaged && i === active ? "is-on" : undefined}
                onMouseEnter={() => {
                  setActive(i);
                  setEngaged(true);
                }}
                onFocus={() => {
                  setActive(i);
                  setEngaged(true);
                }}
              >
                <span className="hm-why-num">{String(i + 1).padStart(2, "0")}</span>
                <span className="hm-why-body">
                  <h3>{w.title}</h3>
                  <p>{w.text}</p>
                </span>
                <svg className="hm-why-arrow" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M4 12 12 4M5.5 4H12v6.5" />
                </svg>
              </li>
            ))}
          </ul>
          {cta && (
            <Link className="hm-btn hm-btn-primary hm-why-cta" href={cta.href}>
              {cta.label}
            </Link>
          )}
        </div>
      </div>
      {children && <div className="hm-why-proof">{children}</div>}
    </>
  );
}
