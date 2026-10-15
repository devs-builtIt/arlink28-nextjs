"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import ClientPager from "@/components/home/ClientPager";
import type { Service } from "@/content/services";

const ALL = "all";
const PAGE_SIZE = 4;

/**
 * The services as tabs. "All" lists every service as a stack of cards that slide over one another as the page
 * scrolls; choosing one tab shows only that service. A service's own address (/services#hotel-reservations) opens
 * on its tab, so links from other pages still land in the right place.
 */
export default function ServicesTabs({ services }: { services: Service[] }) {
  const [active, setActive] = useState<string>(ALL);
  const [page, setPage] = useState(1);
  const tabsRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const fromHash = useCallback(() => {
    const id = window.location.hash.replace("#", "");
    setActive(services.some((s) => s.id === id) ? id : ALL);
    setPage(1);
  }, [services]);

  useEffect(() => {
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [fromHash]);

  const choose = (id: string) => {
    setActive(id);
    setPage(1);
    window.history.replaceState(null, "", id === ALL ? window.location.pathname : `#${id}`);
    // Bring the cards up under the tabs, so the change is seen.
    const top = (listRef.current?.getBoundingClientRect().top ?? 0) + window.scrollY - 150;
    if (window.scrollY > top) window.scrollTo({ top, behavior: "smooth" });
  };

  const onKey = (e: React.KeyboardEvent) => {
    const order = [ALL, ...services.map((s) => s.id)];
    const i = order.indexOf(active);
    const next =
      e.key === "ArrowRight"
        ? order[(i + 1) % order.length]
        : e.key === "ArrowLeft"
          ? order[(i - 1 + order.length) % order.length]
          : null;
    if (!next) return;
    e.preventDefault();
    choose(next);
    tabsRef.current?.querySelector<HTMLButtonElement>(`[data-tab="${next}"]`)?.focus();
  };

  const matching = active === ALL ? services : services.filter((s) => s.id === active);
  const shown = matching.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const stacked = active === ALL;

  const goToPage = (n: number) => {
    setPage(n);
    const top = (listRef.current?.getBoundingClientRect().top ?? 0) + window.scrollY - 150;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <>
      <div className="svc-tabs" role="tablist" aria-label="Services" ref={tabsRef} onKeyDown={onKey}>
        {[{ id: ALL, name: "All services" }, ...services].map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            id={`svc-tab-${s.id}`}
            data-tab={s.id}
            aria-selected={active === s.id}
            aria-controls="svc-panel"
            tabIndex={active === s.id ? 0 : -1}
            onClick={() => choose(s.id)}
          >
            {s.name}
          </button>
        ))}
      </div>

      <div id="svc-panel" role="tabpanel" aria-labelledby={`svc-tab-${active}`} ref={listRef}>
        <ul className={stacked ? "svc-list is-stack" : "svc-list"} key={active}>
          {shown.map((s, i) => (
            <li key={s.id} id={stacked ? s.id : undefined} className="svc" style={{ ["--i" as string]: i }}>
              <div className="svc-info">
                <h2>
                  {s.name}
                  <br />
                  <span className="hm-dim">{s.line}</span>
                </h2>
                <p>{s.text}</p>
                <ul className="svc-checks">
                  {s.checks.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
                <Link className="hm-btn hm-btn-primary" href={s.href}>
                  {s.cta}
                </Link>
              </div>
              <div className="svc-photo">
                <img
                  src={s.image}
                  alt={s.alt}
                  loading="lazy"
                  decoding="async"
                  width={1400}
                  height={1050}
                  style={s.focus ? { objectPosition: s.focus } : undefined}
                />
              </div>
            </li>
          ))}
        </ul>
        <ClientPager page={page} pageSize={PAGE_SIZE} total={matching.length} noun="services" onPage={goToPage} />
      </div>
    </>
  );
}
