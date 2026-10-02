"use client";

import { track } from "@/utils/track";

/** Phones only: a Book now button, always within thumb reach. */
export default function ContactBar() {
  return (
    <div className="hm-bar" role="region" aria-label="Quick contact">
      <a
        className="hm-btn hm-btn-primary"
        href="/quote"
        onClick={() => track("hero_cta_click", { cta: "sticky_quote" })}
      >
        Book now
      </a>
    </div>
  );
}
