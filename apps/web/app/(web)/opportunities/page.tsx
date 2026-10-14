import type { Metadata } from "next";
import Link from "next/link";
import "../../styles/home.css";
import PageBanner from "@/components/PageBanner";
import ClosingCta from "@/components/home/ClosingCta";
import Reveal from "@/components/home/Reveal";

export const metadata: Metadata = {
  title: "Opportunities | ARLink28",
  description: "Careers, investor information and partnership opportunities with ARLink28.",
};

// Openings are listed here as they exist. Add a role to this list when one opens; do not list a role that is not open.
const ROLES = [
  {
    title: "Development Team Member",
    place: "Remote / Lagos, Nigeria",
    team: "Technology",
    text: "Build and maintain the ARLink28 digital platform: booking engines, admin dashboards and customer-facing web applications.",
    skills: ["React", "Node.js", "AWS", "TypeScript"],
  },
];

// What is planned is written as planned. No figures, returns or market projections are stated here until the
// business has confirmed them and they have been reviewed for use in investor material.
const INVEST = [
  {
    title: "A planned base in Ethiopia",
    text: "We intend to base the airline in Addis Ababa, one of Africa's main aviation gateways.",
  },
  {
    title: "A staged approach",
    text: "We are building governance, regulatory compliance and financial discipline before entering full airline operations.",
  },
  {
    title: "Leadership",
    text: "Our team spans aviation, technology and finance. You can read about them on the team page.",
  },
];

const PARTNERS = [
  {
    title: "Airlines",
    text: "African and global carriers we can work with on code-share and interline arrangements.",
  },
  {
    title: "Hospitality",
    text: "Hotel groups, resorts and accommodation providers, to bundle into travel packages.",
  },
  {
    title: "Technology",
    text: "Booking platforms, payment providers and aviation software vendors.",
  },
  {
    title: "Finance",
    text: "Banks, investment firms and financial institutions supporting our growth.",
  },
];

export default function OpportunitiesPage() {
  return (
    <div className="hm">
      <Reveal />
      <PageBanner
        label="Opportunities"
        title={
          <>
            Shape the future
            <br />
            of African aviation
          </>
        }
        intro="Whether you are a professional, an investor or a potential partner, here is how to work with ARLink28 as it builds towards an airline."
        actions={
          <>
            <a className="pb-btn pb-btn-primary" href="#careers">
              View openings
            </a>
            <a className="pb-btn pb-btn-quiet" href="#partnerships">
              Partner with us
            </a>
          </>
        }
      />

      <section className="hm-sec hm-sec-white" id="careers" data-tone="light" aria-labelledby="op-careers">
        <div className="hm-wrap">
          <div className="ab-split">
            <div className="ab-side">
              <h2 className="hm-title hm-title-left" id="op-careers" data-rv>
                <span className="hm-sticker" aria-hidden="true">
                  Careers
                </span>
                Join the
                <br />
                <span className="hm-dim">team.</span>
              </h2>
            </div>
            <div className="ab-body">
              <p className="ab-lead" data-rv>
                We are building towards an airline from the ground up, and we hire people who want to help shape it.
              </p>
              <ul className="opp-roles">
                {ROLES.map((r, i) => (
                  <li key={r.title} data-rv style={{ ["--i" as string]: i }}>
                    <p className="opp-meta">
                      {r.team} · {r.place}
                    </p>
                    <h3>{r.title}</h3>
                    <p>{r.text}</p>
                    <ul className="ab-values">
                      {r.skills.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                    <Link className="hm-btn hm-btn-primary" href="/contact?type=Career">
                      Apply now
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="opp-note" data-rv>
                We hire as we grow. If your skills fit what we are building, send us a message and choose Career, or
                write to <a href="mailto:careers@arlink28.com">careers@arlink28.com</a>.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="hm-sec" id="invest" aria-labelledby="op-invest">
        <div className="hm-wrap">
          <div className="ab-split">
            <div className="ab-side">
              <h2 className="hm-title hm-title-left" id="op-invest" data-rv>
                <span className="hm-sticker" aria-hidden="true">
                  Investors
                </span>
                Invest in what
                <br />
                <span className="hm-dim">we are building.</span>
              </h2>
            </div>
            <div className="ab-body">
              <figure className="opp-photo" data-rv>
                <img
                  src="/images/connect/farnborough.webp"
                  alt="The Apex of Aviation lettering at the Farnborough International Airshow"
                  loading="lazy"
                  decoding="async"
                  width={1600}
                  height={1231}
                />
              </figure>
              <p className="ab-lead" data-rv>
                We are looking for strategic investment partners to help us build towards a regional airline, and we
                will share our plans and our approach with serious investors.
              </p>
              <ul className="cn-why">
                {INVEST.map((v, i) => (
                  <li key={v.title} data-rv style={{ ["--i" as string]: i }}>
                    <strong>{v.title}</strong>
                    <span>{v.text}</span>
                  </li>
                ))}
              </ul>
              <div className="ab-actions" data-rv>
                <Link className="hm-btn hm-btn-primary" href="/contact?type=Investor">
                  Request investor information
                </Link>
              </div>
              <p className="opp-note" data-rv>
                Nothing on this page is an offer to sell, or a solicitation to buy, any securities.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="hm-sec hm-sec-white" id="partnerships" data-tone="light" aria-labelledby="op-partners">
        <div className="hm-wrap">
          <h2 className="hm-title hm-title-left cn-heading" id="op-partners" data-rv>
            <span className="hm-sticker" aria-hidden="true">
              Partnerships
            </span>
            Partner with
            <br />
            <span className="hm-dim">ARLink28.</span>
          </h2>
          <figure className="opp-photo opp-photo-wide" data-rv>
            <img
              src="/images/connect/summit.webp"
              alt="Guests holding certificates on stage at the African Business and Leadership Summit 2026"
              loading="lazy"
              decoding="async"
              width={1600}
              height={1103}
            />
          </figure>
          <ul className="cn-vision">
            {PARTNERS.map((p, i) => (
              <li key={p.title} data-rv style={{ ["--i" as string]: i % 2 }}>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
              </li>
            ))}
          </ul>
          <div className="opp-cta" data-rv>
            <Link className="hm-btn hm-btn-primary" href="/contact?type=Partnership">
              Talk to us about a partnership
            </Link>
          </div>
        </div>
      </section>

      <ClosingCta
        pill="Work with us"
        heading={["Join us.", "Build it with us."]}
        text="Whether as a team member, an investor or a partner, tell us how you would like to be involved."
        cta="Get in touch"
        href="/contact"
      />
    </div>
  );
}
