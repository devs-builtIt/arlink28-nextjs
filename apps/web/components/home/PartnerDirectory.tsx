"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { PartnerKind, TravelPartner } from "@/content/travel-partners";

const ALL = "All partners";
const KINDS: PartnerKind[] = ["Flights", "Visas", "Experiences"];

/** The travel partners with tabs that show only the kind you choose. */
export default function PartnerDirectory({ partners }: { partners: TravelPartner[] }) {
  const [active, setActive] = useState<string>(ALL);
  const tabs = useRef<HTMLDivElement>(null);
  const order = [ALL, ...KINDS];

  const choose = (k: string) => setActive(k);
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const i = order.indexOf(active);
    const next = order[(i + (e.key === "ArrowRight" ? 1 : -1) + order.length) % order.length];
    choose(next);
    tabs.current?.querySelector<HTMLButtonElement>(`[data-tab="${next}"]`)?.focus();
  };

  const shown = active === ALL ? partners : partners.filter((x) => x.kind === active);

  return (
    <>
      <div className="svc-tabs" role="tablist" aria-label="Partner type" ref={tabs} onKeyDown={onKey}>
        {order.map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            id={`pt-tab-${k}`}
            data-tab={k}
            aria-selected={active === k}
            aria-controls="pt-panel"
            tabIndex={active === k ? 0 : -1}
            onClick={() => choose(k)}
          >
            {k}
          </button>
        ))}
      </div>
      <p className="pt-note">
        We may earn a commission if you book through some of these partners, at no extra cost to you. See our{" "}
        <Link href="/affiliate-disclosure">affiliate disclosure</Link>.
      </p>

      <div id="pt-panel" role="tabpanel" aria-labelledby={`pt-tab-${active}`}>
        <ul className="pt-list" key={active}>
          {shown.map((x) => (
            <li key={x.name} className="pt-row">
              <span className="pt-logo">
                <img src={x.logo} alt="" loading="lazy" decoding="async" height={40} />
              </span>
              <div className="pt-body">
                <h2>
                  {x.name} <span className="pt-kind">{x.kind}</span>
                </h2>
                <p className="pt-line">{x.line}</p>
                <p>{x.text}</p>
              </div>
              <Link className="hm-btn hm-btn-primary" href={x.href}>
                {x.cta}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
