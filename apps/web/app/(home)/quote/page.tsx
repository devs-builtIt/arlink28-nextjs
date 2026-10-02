import type { Metadata } from "next";
import "../../styles/home.css";
import QuoteForm from "@/components/home/QuoteForm";
import Reveal from "@/components/home/Reveal";
import { PHONES } from "@/content/home-proof";

export const metadata: Metadata = {
  title: "Get a quote | ARLink28",
  description:
    "Tell us your route and dates, or the trip you have in mind. A member of the ARLink28 team replies with options and a price. Nothing is charged until you agree.",
};

const CONTACTS = [
  {
    label: "Phone number",
    icon: "fa-phone",
    lines: PHONES.map((p) => ({ text: p.label, href: p.href })),
  },
  {
    label: "Lagos office",
    icon: "fa-location-dot",
    lines: [{ text: "Mulliner Towers, Ikoyi", href: undefined }],
  },
  {
    label: "London office",
    icon: "fa-location-dot",
    lines: [{ text: "Shelton Street, Covent Garden", href: undefined }],
  },
];

export default function QuotePage() {
  return (
    <div className="hm">
      <Reveal />
      <section className="hm-qhero hm-wrap" aria-labelledby="hm-qp-h">
        <div className="hm-qhero-card">
          <img src="/images/home/hero-zanzibar-1920.webp" alt="" width={1920} height={1280} fetchPriority="high" />
          <div>
            <h1 id="hm-qp-h">Tell us where, and we will price it.</h1>
            <p>
              Send us your route and dates, or just the idea. A person replies with options and a price, and nothing is
              charged until you agree.
            </p>
          </div>
        </div>
      </section>

      <section className="hm-qp hm-qp-below hm-wrap" aria-label="Quote request">
        <div className="hm-qp-side">
          <img src="/images/home/route-dxb.webp" alt="" width={800} height={1000} />
          <div className="hm-qp-copy">
            <h2>Prefer to talk?</h2>
            <p>Call us, or visit one of our offices. The team answers every request personally.</p>
          </div>
          <ul className="hm-qp-contacts">
            {CONTACTS.map((c) => (
              <li key={c.label}>
                <span className="hm-qp-icon" aria-hidden="true">
                  <i className={`fa-solid ${c.icon}`}></i>
                </span>
                <div>
                  <span>{c.label}</span>
                  {c.lines.map((l) =>
                    l.href ? (
                      <a key={l.text} href={l.href}>
                        {l.text}
                      </a>
                    ) : (
                      <strong key={l.text}>{l.text}</strong>
                    ),
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="hm-qp-card">
          <QuoteForm />
        </div>
      </section>
    </div>
  );
}
