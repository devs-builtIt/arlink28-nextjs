import type { Metadata } from "next";
import "../../styles/home.css";
import QuoteForm from "@/components/home/QuoteForm";
import PageHero from "@/components/home/PageHero";
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
      <PageHero
        id="hm-qp-h"
        title="Tell us where, and we will price it."
        text="Send us your route and dates, or just the idea. A person replies with options and a price, and nothing is charged until you agree."
        image="/images/home/hero-zanzibar-1920.webp"
      />

      <section className="hm-sec hm-sec-white hm-qsec" data-tone="light" aria-label="Quote request">
        <div className="hm-qp hm-wrap">
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
        </div>
      </section>
    </div>
  );
}
