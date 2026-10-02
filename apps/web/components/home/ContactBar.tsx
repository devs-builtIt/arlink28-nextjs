"use client";

import { WHATSAPP_URL } from "@/content/home-proof";
import { track } from "@/utils/track";

/** Phones only: a quote button and WhatsApp, always within thumb reach. */
export default function ContactBar() {
  return (
    <div className="hm-bar" role="region" aria-label="Quick contact">
      <a
        className="hm-btn hm-btn-primary"
        href="/quote"
        onClick={() => track("hero_cta_click", { cta: "sticky_quote" })}
      >
        Get a quote
      </a>
      <a
        className="hm-btn hm-btn-wa"
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track("whatsapp_click", { placement: "sticky_bar" })}
      >
        <i className="fa-brands fa-whatsapp" aria-hidden="true"></i>
        WhatsApp
      </a>
    </div>
  );
}
