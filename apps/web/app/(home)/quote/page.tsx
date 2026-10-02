import type { Metadata } from "next";
import "../../styles/home.css";
import QuoteWidget from "@/components/home/QuoteWidget";
import Reveal from "@/components/home/Reveal";
import { PHONES, WHATSAPP_URL } from "@/content/home-proof";

export const metadata: Metadata = {
  title: "Get a quote | ARLink28",
  description:
    "Tell us your route and dates, or the trip you have in mind. A member of the ARLink28 team replies with options and a price. Nothing is charged until you agree.",
};

const STEPS = [
  {
    title: "Tell us what you need",
    text: "Pick flight, hotel, visa or holiday and fill in the short form. It takes about a minute.",
  },
  {
    title: "We come back with a price",
    text: "A member of the team replies by email or WhatsApp with options and checks the details with you.",
  },
  {
    title: "You decide",
    text: "Nothing is charged until you agree. Once you do, we arrange the booking and stay on hand until you fly.",
  },
];

export default function QuotePage() {
  return (
    <div className="hm">
      <Reveal />
      <section className="hm-qp hm-wrap" aria-labelledby="hm-qp-h">
        <div className="hm-qp-copy">
          <p className="hm-qp-eyebrow">Get a quote</p>
          <h1 id="hm-qp-h">Tell us where, and we will price it.</h1>
          <p className="hm-qp-lead">
            Send us your route and dates, or just the idea. A person replies with options and a price.
          </p>
          <ol className="hm-qp-steps">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <span>0{i + 1}</span>
                <div>
                  <strong>{s.title}</strong>
                  <p>{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="hm-qp-direct">
            Prefer to talk? Call{" "}
            {PHONES.map((p, i) => (
              <span key={p.href}>
                {i > 0 && " or "}
                <a href={p.href}>{p.label}</a>
              </span>
            ))}
            , or <a href={WHATSAPP_URL}>message us on WhatsApp</a>.
          </p>
        </div>
        <div className="hm-qp-form" data-theme="dark">
          <QuoteWidget />
        </div>
      </section>
    </div>
  );
}
