import type { Metadata } from "next";
import Link from "next/link";
import "../../styles/home.css";
import PageBanner from "@/components/PageBanner";
import ClosingCta from "@/components/home/ClosingCta";
import Reveal from "@/components/home/Reveal";
import { ENGAGEMENTS } from "@/content/engagements";

export const metadata: Metadata = {
  title: "Engagement | ARLink28",
  description:
    "How ARLink28 engages across aviation, travel, tourism, investment and business in Africa and internationally.",
};

const SUSTAINABILITY = [
  "Sustainable Aviation Fuel",
  "Aircraft efficiency",
  "Lower-emission technologies",
  "Operational efficiency",
  "Carbon-reduction frameworks",
  "Zero-emission propulsion",
  "Future aircraft technology",
  "Responsible route and network planning",
];

const STAGE = [
  "Commercial flight booking through established travel platforms",
  "Hotel and accommodation partnerships",
  "Holiday-package development",
  "African tourism partnerships",
  "Corporate and executive travel",
  "Private aviation and charter access",
  "Aviation-industry engagement",
  "Expansion across selected African markets",
  "Regulatory preparation",
  "Market research and data collection",
  "Long-term airline planning",
];

export default function EngagementPage() {
  return (
    <div className="hm">
      <Reveal />
      <PageBanner
        label="Engagement"
        title={
          <>
            Connecting through industry.
            <br />
            Building for Africa.
          </>
        }
        intro="ARLink28 takes part in aviation, travel, tourism, sustainability, investment and business events across Africa and internationally."
        actions={
          <>
            <a className="pb-btn pb-btn-primary" href="#engagements">
              Our engagements
            </a>
            <Link className="pb-btn pb-btn-quiet" href="/engagement-details">
              Read the archive
            </Link>
          </>
        }
      />

      <section className="hm-sec hm-sec-white" id="engagements" data-tone="light" aria-labelledby="en-where">
        <div className="hm-wrap">
          <div className="ab-split en-intro">
            <div className="ab-side">
              <h2 className="hm-title hm-title-left" id="en-where" data-rv>
                <span className="hm-sticker" aria-hidden="true">
                  Our engagements
                </span>
                Where ARLink28
                <br />
                <span className="hm-dim">has been.</span>
              </h2>
            </div>
            <div className="ab-body">
              <p className="ab-lead" data-rv>
                Our plans are shaped by taking part in the industries, markets and conversations that are shaping the
                future of African mobility.
              </p>
              <p data-rv style={{ ["--i" as string]: 1 }}>
                Through summits, travel exhibitions, strategic meetings and aviation forums we build our knowledge, our
                relationships and the partnerships our long-term vision needs.
              </p>
            </div>
          </div>
          <ul className="tm-grid en-grid">
            {ENGAGEMENTS.map((e, i) => (
              <li key={e.id} data-rv style={{ ["--i" as string]: i % 3 }}>
                <Link className="tm-card" href={`/engagement-details#${e.id}`}>
                  <span className="tm-photo">
                    <img
                      src={e.images[0].src}
                      alt={e.images[0].alt}
                      loading="lazy"
                      decoding="async"
                      width={e.images[0].w}
                      height={e.images[0].h}
                    />
                    <span className="hm-chip">
                      {e.month.slice(0, 3)} {e.year}
                    </span>
                    <span className="hm-go" aria-hidden="true">
                      <svg viewBox="0 0 16 16">
                        <path d="M4 12 12 4M5.5 4H12v6.5" />
                      </svg>
                    </span>
                  </span>
                  <strong>{e.short}</strong>
                  <span className="tm-role">{e.place}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="ab-actions" data-rv>
            <Link className="hm-btn hm-btn-primary" href="/engagement-details">
              Read the full archive
            </Link>
          </div>
        </div>
      </section>

      <section className="hm-sec" aria-labelledby="en-direction">
        <div className="hm-wrap">
          <div className="ab-split">
            <div className="ab-side">
              <h2 className="hm-title hm-title-left" id="en-direction" data-rv>
                <span className="hm-sticker" aria-hidden="true">
                  Our direction
                </span>
                Where this is
                <br />
                <span className="hm-dim">taking us.</span>
              </h2>
            </div>
            <ul className="ab-rows">
              <li data-rv>
                <h3>Addis Ababa</h3>
                <div>
                  <p>
                    We have identified Addis Ababa, Ethiopia, as an important long-term strategic location for our
                    future aviation plans. Our immediate focus remains the commercial, corporate, regulatory, travel and
                    partnership foundations needed before airline operations can begin.
                  </p>
                  <p className="en-note">
                    ARLink28 is not currently operating flights from Addis Ababa. It is a future strategic hub under
                    development and assessment, not an operational base.
                  </p>
                </div>
              </li>
              <li data-rv>
                <h3>Sustainability</h3>
                <div>
                  <p>
                    Our sustainability approach is being developed alongside our aviation roadmap, informed by industry
                    engagement including the Sustainable Skies World Summit in 2025 and 2026. We are studying:
                  </p>
                  <ul className="ab-values">
                    {SUSTAINABILITY.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              </li>
              <li data-rv>
                <h3>ARLink28 Elite</h3>
                <div>
                  <p>
                    ARLink28 Elite is our private aviation offering for Africa: bespoke charter access, executive travel
                    and VIP aviation, delivered with appropriately licensed aircraft operators.
                  </p>
                  <p>
                    <Link className="en-link" href="/elite-jets">
                      See the tiers
                    </Link>
                  </p>
                </div>
              </li>
              <li data-rv>
                <h3>Tourism partnerships</h3>
                <p>
                  We are developing African travel experiences that connect flights, accommodation, transfers and
                  destination experiences, including our partnership with Blue Ocean Resort &amp; Residences in
                  Zanzibar, alongside other hospitality relationships in development.
                </p>
              </li>
              <li data-rv>
                <h3>Where we are now</h3>
                <div>
                  <p>We are building in phases. Our current activities include:</p>
                  <ul className="ab-values">
                    {STAGE.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                  <p className="en-note">
                    ARLink28 is not currently operating its own scheduled commercial flights or private aircraft.
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="hm-sec hm-sec-white" data-tone="light" aria-labelledby="en-follow">
        <div className="hm-wrap">
          <div className="ab-split">
            <div className="ab-side">
              <h2 className="hm-title hm-title-left" id="en-follow" data-rv>
                <span className="hm-sticker" aria-hidden="true">
                  Stay connected
                </span>
                Follow our
                <br />
                <span className="hm-dim">journey.</span>
              </h2>
            </div>
            <div className="ab-body">
              <p className="ab-lead" data-rv>
                We share where the team is and what we learn there on Instagram and TikTok.
              </p>
              <div className="ab-actions" data-rv>
                <a
                  className="hm-btn hm-btn-primary"
                  href="https://www.instagram.com/fly_arlink28"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Instagram
                </a>
                <a
                  className="hm-btn hm-btn-primary"
                  href="https://www.tiktok.com/@fly_arlink28"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  TikTok
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ClosingCta
        pill="Meet the team"
        heading={["Meet us at an event.", "Or talk to us now."]}
        text="If you would like to meet ARLink28 at an industry event, or talk about working together, send us a message."
        cta="Get in touch"
        href="/contact"
      />
    </div>
  );
}
