import type { Metadata } from "next";
import Link from "next/link";
import "../../styles/home.css";
import PageBanner from "@/components/PageBanner";
import ClosingCta from "@/components/home/ClosingCta";
import Reveal from "@/components/home/Reveal";

export const metadata: Metadata = {
  title: "Connect | ARLink28",
  description:
    "ARLink28 is a Pan-African travel company building towards an airline, with the aim of making movement across Africa easier and better connected.",
};

// The vision and the work, in plain statements. What is planned is written as planned, not as done.
const VISION = [
  {
    title: "Accessible travel",
    text: "We want people to move easily between countries for business, tourism, education, investment, family and culture. By reducing the barriers to travel within Africa, we aim to make regional mobility open to everyone.",
  },
  {
    title: "Cross-regional links",
    text: "We aim to strengthen direct connections between West, East, Central, Southern and North Africa, reducing unnecessary multi-stop journeys and linking key commercial and cultural hubs.",
  },
  {
    title: "An aviation future",
    text: "We are building towards a wider aviation future, with a role in connecting underserved African markets, on routes where there is commercial demand but few travel options.",
  },
  {
    title: "Sustainable growth",
    text: "Our expansion is grounded in connectivity before scale, partnerships before ownership, and solid operational foundations before rapid growth.",
  },
];

type Activity = {
  title: string;
  line: string;
  text: string;
  image: string;
  alt: string;
  focus?: string;
  cta?: string;
  href?: string;
};

const TODAY: Activity[] = [
  {
    title: "Travel booking",
    line: "From first search to arrival",
    text: "We provide supported travel booking through our website and direct channels such as WhatsApp, guiding each customer from the first search to arrival.",
    image: "/images/home/team-support.webp",
    alt: "A member of the ARLink28 team on the phone at a desk",
    focus: "50% 12%",
    cta: "Get a quote",
    href: "/quote",
  },
  {
    title: "Hotels and resort packages",
    line: "Curated stays and escapes",
    text: "We work with African hospitality properties, such as Blue Ocean Resort & Residences in Zanzibar, on curated stays, escapes and safari packages.",
    image: "/images/home/hero-zanzibar-1920.webp",
    alt: "A sandbar surrounded by turquoise water, seen from above, in Zanzibar",
    cta: "See packages",
    href: "/packages",
  },
  {
    title: "Tourism and destinations",
    line: "Working with local partners",
    text: "We work with tourism boards, hospitality providers and local tour operators to bring visitors to emerging and established destinations.",
    image: "/images/connect/tourism.webp",
    alt: "Three members of the ARLink28 team at the Spotlight on Africa and Indian Ocean Islands TravelExpo",
    focus: "50% 30%",
    cta: "Explore destinations",
    href: "/destinations",
  },
  {
    title: "Private aviation",
    line: "An asset-light approach to charter",
    text: "We connect corporate executives, government delegations and institutional clients with appropriately licensed aircraft operators.",
    image: "/images/home/jet-challenger-604-1600.webp",
    alt: "A silver Challenger 604 with a red stripe on the apron",
    cta: "See the tiers",
    href: "/elite-jets",
  },
  {
    title: "Aviation partnerships",
    line: "Airlines, airports, regulators",
    text: "We engage with airlines, airport authorities, regulators and industry leaders, including at global summits, to build regional networks and better links between airlines.",
    image: "/images/connect/farnborough.webp",
    alt: "The Apex of Aviation lettering at the Farnborough International Airshow",
    cta: "See our engagements",
    href: "/engagement",
  },
  {
    title: "Building a network",
    line: "UK, Nigeria and East Africa",
    text: "We are setting up operations in key gateways, starting with the UK and Nigeria, with a focus on East Africa (Kenya and Ethiopia), and will extend to markets where there is clear demand.",
    image: "/images/connect/network.webp",
    alt: "A map of Africa at night with the planned routes between Lagos, Addis Ababa, Nairobi, Johannesburg, Dakar, Accra and Cairo",
  },
  {
    title: "Technology",
    line: "The data behind the routes",
    text: "We use travel data and booking patterns to see where route demand is emerging and to improve the customer experience, which will inform future route planning.",
    image: "/images/services/flights.webp",
    alt: "A passport in the shape of Africa beside a laptop showing a flight search",
    focus: "50% 88%",
  },
  {
    title: "Compliance and readiness",
    line: "Foundations before flying",
    text: "We are building corporate governance, legal frameworks and regulatory credentials step by step before moving to full airline operations.",
    image: "/images/connect/lords.webp",
    alt: "Guests gathered under a large painting at an African leadership event in the House of Lords",
    focus: "50% 40%",
  },
];

const WHY = [
  { title: "Internal connectivity", text: "Making travel between African countries easier, faster and more direct." },
  { title: "Discoverable destinations", text: "Showing African culture, commercial centres and natural wonders." },
  { title: "Business mobility", text: "Helping entrepreneurs and investors move across regional markets." },
  { title: "Economic opportunity", text: "Supporting local jobs, hospitality providers and tourism growth." },
];

export default function ConnectPage() {
  return (
    <div className="hm">
      <Reveal />
      <PageBanner
        label="Connect"
        title={
          <>
            ARLink28,
            <br />
            connecting Africa
          </>
        }
        intro="A Pan-African travel company building towards an airline, to make moving across Africa easier and better connected."
        actions={
          <>
            <a className="pb-btn pb-btn-primary" href="#vision">
              Explore our vision
            </a>
            <Link className="pb-btn pb-btn-quiet" href="/contact">
              Partner with us
            </Link>
          </>
        }
      />

      <section className="hm-sec hm-sec-white" id="overview" data-tone="light" aria-labelledby="cn-gap">
        <div className="hm-wrap">
          <div className="ab-split">
            <div className="ab-side">
              <h2 className="hm-title hm-title-left" id="cn-gap" data-rv>
                <span className="hm-sticker" aria-hidden="true">
                  The gap
                </span>
                Moving between
                <br />
                <span className="hm-dim">African countries.</span>
              </h2>
            </div>
            <div className="ab-body">
              <p className="ab-lead" data-rv>
                Africa is a continent of enormous opportunity, yet moving between its countries is still harder than it
                should be.
              </p>
              <p data-rv style={{ ["--i" as string]: 1 }}>
                Travellers often connect through Europe or the Middle East to reach another African destination.
                Businesses face complicated routes, tourists meet fragmented booking, and many destinations stay
                underserved despite their economic and tourism potential.
              </p>
            </div>
          </div>

          <figure className="cn-quote" data-rv>
            <span className="hm-sticker" aria-hidden="true">
              Foundations first
            </span>
            <blockquote>
              A connected Africa takes more than aircraft. It takes tourism, technology, infrastructure, partnerships,
              distribution, trust, regulation and strong commercial relationships, and an understanding of how people
              actually move across the continent. That is what ARLink28 is building.
            </blockquote>
          </figure>
        </div>
      </section>

      <section className="hm-sec" id="vision" aria-labelledby="cn-vision">
        <div className="hm-wrap">
          <h2 className="hm-title hm-title-left cn-heading" id="cn-vision" data-rv>
            <span className="hm-sticker" aria-hidden="true">
              Our vision
            </span>
            Where we are
            <br />
            <span className="hm-dim">heading.</span>
          </h2>
          <ul className="cn-vision">
            {VISION.map((v, i) => (
              <li key={v.title} data-rv style={{ ["--i" as string]: i % 2 }}>
                <h3>{v.title}</h3>
                <p>{v.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="hm-sec hm-sec-white" id="pillars" data-tone="light" aria-labelledby="cn-today">
        <div className="hm-wrap">
          <h2 className="hm-title hm-title-left cn-heading" id="cn-today" data-rv>
            <span className="hm-sticker" aria-hidden="true">
              Today
            </span>
            What ARLink28
            <br />
            <span className="hm-dim">does today.</span>
          </h2>
          <ul className="svc-list is-stack">
            {TODAY.map((t, i) => (
              <li key={t.title} className="svc" style={{ ["--i" as string]: i }}>
                <div className="svc-info">
                  <span className="cn-no">{String(i + 1).padStart(2, "0")}</span>
                  <h3>
                    {t.title}
                    <br />
                    <span className="hm-dim">{t.line}</span>
                  </h3>
                  <p>{t.text}</p>
                  {t.cta && t.href && (
                    <Link className="hm-btn hm-btn-primary" href={t.href}>
                      {t.cta}
                    </Link>
                  )}
                </div>
                <div className="svc-photo">
                  <img
                    src={t.image}
                    alt={t.alt}
                    loading="lazy"
                    decoding="async"
                    width={1600}
                    height={1000}
                    style={t.focus ? { objectPosition: t.focus } : undefined}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="hm-sec" aria-labelledby="cn-why">
        <div className="hm-wrap">
          <div className="ab-split">
            <div className="ab-side">
              <h2 className="hm-title hm-title-left" id="cn-why" data-rv>
                <span className="hm-sticker" aria-hidden="true">
                  Our purpose
                </span>
                Why ARLink28
                <br />
                <span className="hm-dim">exists.</span>
              </h2>
            </div>
            <div className="ab-body">
              <p className="ab-lead" data-rv>
                Africa deserves stronger connections within itself. The future of African travel should increasingly be
                shaped by organisations that understand Africa&rsquo;s markets, people, challenges and potential.
              </p>
              <ul className="cn-why">
                {WHY.map((w, i) => (
                  <li key={w.title} data-rv style={{ ["--i" as string]: i }}>
                    <strong>{w.title}</strong>
                    <span>{w.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <ClosingCta
        pill="Partnerships"
        heading={["Partner with us.", "Let's connect Africa."]}
        text="Tell us how you would like to work with ARLink28: strategic partnerships, travel arrangements or commercial collaborations."
        cta="Get in touch"
        href="/contact"
      />
    </div>
  );
}
