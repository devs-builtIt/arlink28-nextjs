import type { Metadata } from "next";
import Link from "next/link";
import "../../styles/home.css";
import PageHero from "@/components/home/PageHero";
import Reveal from "@/components/home/Reveal";
import { loadEliteTiers } from "@/utils/server/elite";

export const metadata: Metadata = {
  title: "Elite private aviation | ARLink28",
  description:
    "ARLink28 Elite, Elite Signature and Bespoke: private aircraft charter with ground transfers, meet and greet and the level of personal service you choose.",
};

const STEPS = [
  {
    title: "Tell us the journey",
    text: "Where you want to fly, when, and with how many people. Choose a tier, or tell us what you have in mind.",
  },
  {
    title: "We come back with options",
    text: "A member of the Elite team replies with aircraft options and a quote, and checks the details with you.",
  },
  {
    title: "You decide",
    text: "Nothing is charged until you agree. Once you do, we coordinate the flight, the ground and the welcome.",
  },
];

export default async function EliteJetsPage() {
  const tiers = await loadEliteTiers();
  const bySlug = new Map(tiers.map((t) => [t.slug, t]));

  return (
    <div className="hm">
      <Reveal />
      <PageHero
        id="el-h1"
        title="Private aviation, arranged around you."
        text="Three ways to fly private with ARLink28, from the essentials done well to a journey designed entirely for you."
        image="/images/home/jet-sunset-900.webp"
        position="50% 60%"
      />

      <section className="hm-sec hm-sec-white" data-tone="light" aria-labelledby="el-tiers">
        <div className="hm-wrap">
          <h2 className="hm-title hm-title-left" id="el-tiers" data-rv>
            <span className="hm-sticker" aria-hidden="true">
              Elite
            </span>
            Choose how personal it gets.
          </h2>
          <ol className="el-tiers">
            {tiers.map((t, i) => {
              const base = t.basedOn ? bySlug.get(t.basedOn) : undefined;
              return (
                <li key={t.slug} id={t.slug} className="el-tier" data-rv style={{ ["--i" as string]: i }}>
                  <div className="el-tier-photo">
                    <img src={t.image} alt={t.alt} loading="lazy" decoding="async" width={900} height={675} />
                  </div>
                  <div className="el-tier-body">
                    <p className="el-tier-no">Tier 0{i + 1}</p>
                    <h3>{t.title}</h3>
                    <p className="el-tier-tag">{t.tagline}</p>
                    {t.audience && <p className="el-tier-aud">{t.audience}</p>}
                    <p className="el-tier-inc">{base ? `Everything in ${base.title}, plus` : "Includes"}</p>
                    <ul>
                      {t.includes.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ul>
                    <Link className="hm-btn hm-btn-dark" href={`/contact?type=Booking&slug=${t.slug}`}>
                      Enquire about {t.tier}
                    </Link>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="hm-sec" aria-labelledby="el-how">
        <div className="hm-wrap">
          <h2 className="hm-title hm-title-left" id="el-how" data-rv>
            <span className="hm-sticker" aria-hidden="true">
              How it works
            </span>
            From enquiry to take-off.
          </h2>
          <ol className="hm-process">
            {STEPS.map((s, i) => (
              <li key={s.title} data-rv style={{ ["--i" as string]: i }}>
                <span className="hm-process-step">Step 0{i + 1}</span>
                <p>{s.text}</p>
                <div className="hm-process-foot">
                  <h3>{s.title}</h3>
                </div>
              </li>
            ))}
          </ol>
          <div className="el-end" data-rv>
            <Link className="hm-btn hm-btn-primary" href="/contact?type=Booking">
              Book a charter
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
