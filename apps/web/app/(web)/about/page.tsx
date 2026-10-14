import type { Metadata } from "next";
import Link from "next/link";
import "../../styles/home.css";
import PageBanner from "@/components/PageBanner";
import ClosingCta from "@/components/home/ClosingCta";
import PartnerLogos from "@/components/home/PartnerLogos";
import Reveal from "@/components/home/Reveal";

export const metadata: Metadata = {
  title: "About ARLink28 | Travel across Africa",
  description:
    "ARLink28 is a Pan-African travel agency that arranges flights, hotels, visas and holidays, and is building towards an airline of its own.",
};

// What guides the business. Plain statements, in the owner's own words and trimmed.
const PRINCIPLES = [
  {
    title: "Mission",
    text: "To make travel within Africa easier and more efficient, connecting people, destinations and opportunities through partnerships, technology and good service.",
  },
  {
    title: "Vision",
    text: "To become one of Africa's leading travel brands, with a connected Pan-African travel network that strengthens regional mobility.",
  },
  {
    title: "Tourism",
    text: "Tourism creates jobs, trade and cultural exchange. We work with tourism boards, hospitality providers and destination organisations to show the range of Africa.",
  },
  {
    title: "Sustainability",
    text: "We promote environmentally conscious travel, support local employment, work with communities, and are exploring sustainable aviation practices.",
  },
  {
    title: "Partnerships",
    text: "We build relationships with airlines, airports, hotels, governments, financial and educational institutions, technology companies and regional stakeholders who share the aim of a better connected Africa.",
  },
];

const VALUES = ["Integrity", "Connectivity", "Collaboration", "Innovation", "Sustainability"];

export default function AboutPage() {
  return (
    <div className="hm">
      <Reveal />
      <PageBanner
        label="About us"
        title={
          <>
            Connecting people,
            <br />
            destinations and dreams.
          </>
        }
        intro="ARLink28 is a Pan-African travel agency today, building towards an airline of its own."
        actions={
          <a className="pb-btn pb-btn-primary" href="#about">
            Discover us
          </a>
        }
      />

      <section className="hm-sec hm-sec-white" id="about" data-tone="light" aria-labelledby="ab-who">
        <div className="hm-wrap">
          <div className="ab-split">
            <div className="ab-side">
              <h2 className="hm-title hm-title-left" id="ab-who" data-rv>
                <span className="hm-sticker" aria-hidden="true">
                  Who we are
                </span>
                Built for travel
                <br />
                <span className="hm-dim">across Africa.</span>
              </h2>
            </div>
            <div className="ab-body">
              <p className="ab-lead" data-rv>
                ARLink28 is a Pan-African travel agency. We arrange flights, hotel reservations, visa support and
                holidays, and we are building towards an airline of our own.
              </p>
              <p data-rv style={{ ["--i" as string]: 1 }}>
                Africa has more than 1.4 billion people and some of the world&rsquo;s fastest-growing economies, yet
                travelling between African countries is still harder than it should be. We started ARLink28 to change
                that, for business, tourism, education and investment.
              </p>
              <p data-rv style={{ ["--i" as string]: 2 }}>
                We work with travel agencies, visa specialists, hotels and destination providers across the continent,
                so one team can look after the whole trip, from departure to arrival.
              </p>
              <p data-rv style={{ ["--i" as string]: 3 }}>
                Our longer-term plan is aviation. We intend to establish a regional airline based in Addis Ababa,
                Ethiopia, one of Africa&rsquo;s main aviation gateways, to improve links across East, West, Central,
                North and Southern Africa. We are taking it in stages, building governance, regulatory compliance and
                financial discipline before entering full airline operations.
              </p>
              <div className="ab-actions" data-rv style={{ ["--i" as string]: 4 }}>
                <Link className="hm-btn hm-btn-primary" href="/contact">
                  Get in touch
                </Link>
                <Link className="hm-btn hm-btn-primary" href="/services">
                  Our services
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="hm-sec" aria-labelledby="ab-stand">
        <div className="hm-wrap">
          <div className="ab-split">
            <div className="ab-side">
              <h2 className="hm-title hm-title-left" id="ab-stand" data-rv>
                <span className="hm-sticker" aria-hidden="true">
                  What guides us
                </span>
                What we stand
                <br />
                <span className="hm-dim">for.</span>
              </h2>
            </div>
            <ul className="ab-rows">
              {PRINCIPLES.map((p, i) => (
                <li key={p.title} data-rv style={{ ["--i" as string]: i }}>
                  <h3>{p.title}</h3>
                  <p>{p.text}</p>
                </li>
              ))}
              <li data-rv style={{ ["--i" as string]: PRINCIPLES.length }}>
                <h3>Values</h3>
                <ul className="ab-values">
                  {VALUES.map((v) => (
                    <li key={v}>{v}</li>
                  ))}
                </ul>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="hm-sec hm-sec-white" data-tone="light" aria-labelledby="ab-founder">
        <div className="hm-wrap">
          <div className="ab-founder" data-rv>
            <div className="ab-founder-photo">
              <img
                src="/images/about/founder.webp"
                alt="Ajay E. Salako, founder of ARLink28, in a white ARLink28 jacket and red tie"
                loading="lazy"
                decoding="async"
                width={1000}
                height={1500}
              />
            </div>
            <div className="ab-founder-body">
              <span className="hm-sticker" aria-hidden="true">
                Meet the founder
              </span>
              <h2 id="ab-founder" className="sr-only">
                Meet the founder
              </h2>
              <blockquote>
                &ldquo;From early instinct, to field experience, to strategic vision: ARLink28 is the result of that
                progression.&rdquo;
              </blockquote>
              <div className="ab-founder-text">
                <p>
                  ARLink28 was born from a lifelong fascination with aviation and travel. From early childhood I was
                  curious about aeroplanes, flight routes and how they connect cultures.
                </p>
                <p>
                  I grew up in Nigeria and moved to the United Kingdom, where that interest became a passion. Seeing how
                  travel closes distances, shapes careers and connects people across continents made me want to build a
                  platform that makes booking easier and more reliable.
                </p>
                <p>
                  My years in the UK included work in corporate travel, on the customer service and operations side,
                  which gave me a clear view of what travellers really need. ARLink28 is built around those needs: safe,
                  reliable and affordable travel for anyone flying within Africa or connecting globally.
                </p>
              </div>
              <div className="ab-founder-foot">
                <p>
                  <strong>Ajay E. Salako</strong>
                  <span>Founder and Tech VC</span>
                </p>
                <Link className="hm-btn hm-btn-primary" href="/team">
                  Meet the team
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="hm-sec" aria-labelledby="ab-unite">
        <div className="hm-wrap">
          <div className="ab-statement">
            <h2 className="hm-title" id="ab-unite" data-rv>
              <span className="hm-sticker" aria-hidden="true">
                Why it matters
              </span>
              Travel has the power
              <br />
              <span className="hm-dim">to unite people.</span>
            </h2>
            <p data-rv style={{ ["--i" as string]: 1 }}>
              Travel opens economic opportunities, encourages new ideas and strengthens relationships across borders. We
              want Africa to be better connected, easier to reach and easier to discover, and we hold ourselves to
              professionalism, integrity and good service as we build it.
            </p>
          </div>
        </div>
      </section>

      <div className="hm-sec-white ab-partners" data-tone="light">
        <PartnerLogos />
      </div>

      <ClosingCta />
    </div>
  );
}
