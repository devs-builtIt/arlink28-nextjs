"use client";

import { ROUTES } from "@/content/home-proof";
import { track } from "@/utils/track";
import { ROUTE_EVENT, type RouteDetail } from "./QuoteWidget";

/** Photo cards for destinations. Choosing one fills in the quote form and takes the visitor to it. */
export default function RouteCards() {
  return (
    <ul className="hm-routes" aria-label="Start a quote for a destination">
      {ROUTES.map((r, i) => (
        <li
          key={`${r.from}-${r.to}`}
          className={r.full ? "is-full" : r.wide ? "is-wide" : undefined}
          data-rv
          style={{ ["--i" as string]: i }}
        >
          <button
            type="button"
            onClick={() => {
              track("route_card_click", { route: `${r.from}-${r.to}` });
              window.dispatchEvent(new CustomEvent<RouteDetail>(ROUTE_EVENT, { detail: { from: r.from, to: r.to } }));
            }}
          >
            <img src={r.photo} alt="" loading="lazy" decoding="async" width={800} height={1000} />
            <span className="hm-chip">{r.to}</span>
            <span className="hm-go" aria-hidden="true">
              <svg viewBox="0 0 16 16">
                <path d="M4 12 12 4M5.5 4H12v6.5" />
              </svg>
            </span>
            <span className="hm-routes-text">
              <strong>{r.toCity}</strong>
              <span>From {r.fromCity} · Quote on request</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
