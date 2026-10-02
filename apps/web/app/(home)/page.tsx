import type { Metadata } from "next";
import Link from "next/link";
import "../styles/home.css";

import ContactBar from "@/components/home/ContactBar";
import HeroRipple from "@/components/home/HeroRipple";
import Icon from "@/components/home/Icon";
import QuoteWidget from "@/components/home/QuoteWidget";
import Reveal from "@/components/home/Reveal";
import RouteCards from "@/components/home/RouteCards";
import {
  FAQ,
  GOOGLE_REVIEWS_URL,
  HAPPY,
  PARTNERS,
  PARTNER_LOGOS,
  PHONES,
  RATING,
  REVIEWS,
  REVIEW_SUMMARY,
  SAMPLE,
  WHATSAPP_URL,
  WHY,
} from "@/content/home-proof";
import { priceLabel } from "@/utils/packages";
import { listPackages } from "@/utils/server/catalogue";
import { isUploaded, testPhotosEnabled, testPhotosFor } from "@/utils/testPhotos";

const SITE = "https://arlink28.com";

export const metadata: Metadata = {
  title: "ARLink28 | Flights, hotels, visas and holidays across Africa",
  description:
    "Tell ARLink28 where you are going and a person replies with options and a price: flights, hotel reservations, visa support and holidays across Africa and beyond.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "ARLink28 | Travel across Africa with people who know the routes",
    description: "Flights, hotels, visas and holidays across Africa and beyond, arranged for you.",
    url: SITE,
    siteName: "ARLink28",
    type: "website",
    images: [{ url: "/images/home/hero-zanzibar-1920.webp", width: 1920, height: 1080 }],
  },
};

// Revalidate the live packages band with the rest of the catalogue.
export const revalidate = 60;

const MARQUEE = ["Flights", "Hotels", "Visas", "Holidays", "Across Africa", "and beyond"];

const STEPS = [
  {
    icon: "pin",
    title: "Tell us where",
    text: "Send the route and dates, or just the idea. It takes about a minute and nothing is charged.",
  },
  {
    icon: "person",
    title: "We come back with a price",
    text: "A member of the team replies by email or WhatsApp with options, and checks the details with you.",
  },
  {
    icon: "shield",
    title: "We book it, you travel",
    text: "Once you agree, we arrange the booking and stay on hand if anything changes before you fly.",
  },
] as const;

async function loadPackages() {
  try {
    const list = await listPackages({ size: 3 });
    return list.items.slice(0, 3);
  } catch {
    return [];
  }
}

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["Organization", "TravelAgency"],
      "@id": `${SITE}/#organization`,
      name: "ARLink28",
      url: SITE,
      logo: `${SITE}/images/logo.png`,
      description: "Flights, hotel reservations, visa support and holidays across Africa and beyond.",
      telephone: "+2347047009128",
      sameAs: ["https://www.instagram.com/fly_arlink28"],
      contactPoint: [
        { "@type": "ContactPoint", telephone: "+2347047009128", contactType: "customer service" },
        { "@type": "ContactPoint", telephone: "+447539071257", contactType: "customer service" },
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE}/#website`,
      url: SITE,
      name: "ARLink28",
      publisher: { "@id": `${SITE}/#organization` },
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQ.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
};

/** A section title with its tilted sticker label. */
const initials = (name: string) =>
  name
    .replace(/[[\]]/g, "")
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const JETS = [
  {
    title: "Business trips",
    chip: "Charter",
    text: "Flexible departure times for you and your team.",
    image: "/images/home/jet-tarmac-900.webp",
    alt: "A private jet on the apron under a sunset sky",
    h: 1350,
  },
  {
    title: "Family and leisure",
    chip: "Charter",
    text: "Fly private to the lodge or island you are heading for.",
    image: "/images/home/jet-sunset-900.webp",
    alt: "A private jet parked on the tarmac at golden hour",
    h: 575,
  },
  {
    title: "Groups and events",
    chip: "Charter",
    text: "Travel together, in a cabin sized to your party.",
    image: "/images/home/jet-cabin-900.webp",
    alt: "The leather seats and oval windows of a private jet cabin",
    h: 675,
  },
];

// Blog teasers. There are no published posts yet, so the cards say "Coming soon" and link to the blog page.
const POSTS = [
  {
    title: "Lagos to London: what to know before you fly",
    image: "/images/home/route-lhr.webp",
    alt: "Big Ben and the London Eye under a blue sky",
  },
  {
    title: "Dubai from Abuja: a plain checklist for visas and flights",
    image: "/images/home/route-dxb.webp",
    alt: "The Dubai skyline at sunset, with the Burj Khalifa",
  },
  {
    title: "Zanzibar for first-timers: when to go and where to stay",
    image: "/images/home/hero-zanzibar-900.webp",
    alt: "A sandbar surrounded by turquoise water in Zanzibar",
  },
];

function Title({ sticker, children, id }: { sticker: string; children: React.ReactNode; id: string }) {
  return (
    <h2 className="hm-title" id={id} data-rv>
      <span className="hm-sticker" aria-hidden="true">
        {sticker}
      </span>
      {children}
    </h2>
  );
}

export default async function HomePage() {
  const packages = await loadPackages();

  return (
    <div className="hm">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Reveal />

      {/* 1. Hero: a photo card with the quote panel docked in it */}
      <section className="hm-hero" aria-labelledby="hm-h1">
        <div className="hm-hero-card">
          <img
            className="hm-hero-img"
            src="/images/home/hero-zanzibar-1920.webp"
            srcSet="/images/home/hero-zanzibar-900.webp 900w, /images/home/hero-zanzibar-1920.webp 1920w, /images/home/hero-zanzibar-2400.webp 2400w"
            sizes="100vw"
            width={1920}
            height={1080}
            alt=""
            fetchPriority="high"
          />
          <HeroRipple src="/images/home/hero-zanzibar-1920.webp" smallSrc="/images/home/hero-zanzibar-900.webp" />
          <div className="hm-hero-body">
            <div className="hm-hero-copy">
              <h1 id="hm-h1">Travel across Africa with people who know the routes.</h1>
              <p className="hm-rating">
                <b className="hm-rating-score">
                  {RATING.value} <span aria-hidden="true">{"★"}</span>
                </b>{" "}
                on {RATING.platform} ({RATING.count})
              </p>
            </div>
            <QuoteWidget />
          </div>
        </div>
      </section>

      {/* 2. Destinations, straight after the hero, as the market leaders do */}
      <section className="hm-sec" id="destinations" aria-labelledby="hm-routes">
        <div className="hm-wrap">
          <div className="hm-row-head">
            <h2 className="hm-title hm-title-left" id="hm-routes" data-rv>
              <span className="hm-sticker" aria-hidden="true">
                Destinations
              </span>
              Pick a destination, and we fill in the form.
            </h2>
            <Link className="hm-btn hm-btn-quiet" href="/destinations">
              More destinations
            </Link>
          </div>
          <RouteCards />
        </div>
      </section>

      {/* 5. Marquee, on the page's own surface */}
      <div className="hm-marquee" aria-hidden="true">
        <div className="hm-marquee-track">
          {[0, 1].map((n) => (
            <ul key={n}>
              {MARQUEE.map((w, i) => (
                <li key={w} className={i % 2 === 1 ? "is-outline" : undefined}>
                  {w}
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>

      {/* 6. Why choose us, on a white section. Under the reasons, a flat rating card with the partner logos
          scrolling right to left and sliding away into it. */}
      <section className="hm-sec hm-sec-white" data-tone="light" aria-labelledby="hm-why">
        <div className="hm-wrap">
          <Title id="hm-why" sticker="Why choose us?">
            Travel planned by people, not algorithms.
          </Title>
          <div className="hm-how">
            <div className="hm-how-photo" data-rv>
              <img
                src="/images/home/team-support.webp"
                alt=""
                loading="lazy"
                decoding="async"
                width={800}
                height={1000}
              />
              <a className="hm-ring" href="/quote" aria-label="Get a quote">
                <svg viewBox="0 0 120 120" aria-hidden="true">
                  <defs>
                    <path id="hm-ring-path" d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" />
                  </defs>
                  <text>
                    <textPath href="#hm-ring-path" textLength="270" lengthAdjust="spacing">
                      TRAVEL ACROSS AFRICA · GET A QUOTE ·{" "}
                    </textPath>
                  </text>
                </svg>
                <i aria-hidden="true">&rarr;</i>
              </a>
            </div>
            <div className="hm-why-side">
              <ul className="hm-steps">
                {[WHY[0], WHY[1], WHY[4]].map((w, i) => (
                  <li key={w.title} data-rv style={{ ["--i" as string]: i }}>
                    <Icon name={w.icon} />
                    <div>
                      <h3>{w.title}</h3>
                      <p>{w.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="hm-proof" data-rv>
                <div className="hm-proof-card">
                  <p className="hm-proof-rating">
                    <span className="hm-stars" aria-hidden="true">
                      {"★★★★★"}
                    </span>
                    <b>{REVIEW_SUMMARY.score}</b>
                    <span>on Google</span>
                  </p>
                  <p className="hm-proof-small">{RATING.count}</p>
                  <p className="hm-proof-count">
                    <b>{HAPPY.value}</b> {HAPPY.label}
                  </p>
                </div>
                <div className="hm-logos">
                  <div className="hm-logos-track">
                    {[0, 1].map((n) => (
                      <ul
                        key={n}
                        aria-hidden={n === 1 ? "true" : undefined}
                        aria-label={n === 0 ? "Our partners" : undefined}
                      >
                        {PARTNER_LOGOS.map((l) => (
                          <li key={l.name}>
                            <img src={l.src} alt={n === 0 ? l.name : ""} loading="lazy" decoding="async" height={40} />
                          </li>
                        ))}
                      </ul>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Packages, live from the catalogue */}
      {packages.length > 0 && (
        <section className="hm-sec hm-sec-grey" aria-labelledby="hm-pkgs">
          <div className="hm-wrap">
            <div className="hm-row-head">
              <h2 className="hm-title hm-title-left" id="hm-pkgs" data-rv>
                <span className="hm-sticker" aria-hidden="true">
                  Holidays
                </span>
                Packages with the price shown.
              </h2>
              <Link className="hm-btn hm-btn-quiet" href="/packages">
                See all packages
              </Link>
            </div>
            <ul className="hm-pkgs">
              {packages.map((pkg, i) => {
                const stock = testPhotosEnabled() && !isUploaded(pkg.heroImagePath);
                const photo = stock
                  ? testPhotosFor(pkg.slug, pkg.destination.slug, { count: 1, width: 900 })[0].src
                  : pkg.heroImagePath;
                return (
                  <li key={pkg.id} data-rv style={{ ["--i" as string]: i }}>
                    <Link href={`/packages/${pkg.slug}`}>
                      {photo && <img src={photo} alt="" loading="lazy" decoding="async" width={720} height={900} />}
                      <span className="hm-chip">{pkg.destination.name}</span>
                      <span className="hm-go" aria-hidden="true">
                        <svg viewBox="0 0 16 16">
                          <path d="M4 12 12 4M5.5 4H12v6.5" />
                        </svg>
                      </span>
                      <span className="hm-pkg-text">
                        <strong>{pkg.title}</strong>
                        <span>
                          {pkg.fromPriceMinor != null
                            ? `From ${priceLabel(pkg.fromPriceMinor, pkg.baseCurrency)}`
                            : "Price on request"}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      {/* 7b. Reviews, after the packages: heading, rating and a photo on the left; two columns of review cards
          scrolling slowly in opposite directions on the right. Review text is placeholder until real. */}
      <section className="hm-sec hm-sec-white" data-tone="light" aria-labelledby="hm-reviews">
        <div className="hm-wrap">
          <div className="hm-rv">
            <div className="hm-rv-side">
              <h2 className="hm-title hm-title-left" id="hm-reviews" data-rv>
                <span className="hm-sticker" aria-hidden="true">
                  Happy travellers
                </span>
                Memorable journeys shared by travellers.
              </h2>
              <div className="hm-rv-rating" data-rv>
                <b>{REVIEW_SUMMARY.score}</b>
                <div>
                  <span className="hm-stars" aria-hidden="true">
                    {"★★★★★"}
                  </span>
                  <p>{REVIEW_SUMMARY.basis}</p>
                </div>
              </div>
              <a className="hm-rv-link" href={GOOGLE_REVIEWS_URL} target="_blank" rel="noopener noreferrer" data-rv>
                Read all reviews on Google <span aria-hidden="true">&rsaquo;</span>
              </a>
              <img
                className="hm-rv-photo"
                src="/images/home/review-couple-1400.webp"
                alt="A couple laughing and holding hands in long grass beside a safari vehicle"
                loading="lazy"
                decoding="async"
                width={1400}
                height={933}
                data-rv
              />
            </div>
            <div className="hm-rv-cols">
              {[0, 1].map((col) => (
                <div className={`hm-rv-col hm-rv-col-${col}`} key={col}>
                  <div className="hm-rv-track">
                    {[0, 1].map((copy) => (
                      <ul key={copy} aria-hidden={copy === 1 ? "true" : undefined}>
                        {REVIEWS.filter((_, i) => i % 2 === col).map((r, i) => (
                          <li key={i} className="hm-rv-card">
                            <div className="hm-rv-top">
                              <span className="hm-stars" aria-hidden="true">
                                {"★★★★★"}
                              </span>
                              <span className="hm-rv-src">{r.source}</span>
                            </div>
                            <blockquote className={SAMPLE ? "hm-placeholder" : undefined}>{r.text}</blockquote>
                            <footer>
                              <span className="hm-rv-av" aria-hidden="true">
                                {initials(r.name)}
                              </span>
                              <span>
                                <strong>{r.name}</strong>
                                <small>{r.route}</small>
                              </span>
                            </footer>
                          </li>
                        ))}
                      </ul>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 7c. Elite Jets teaser, after the reviews: three kinds of charter, no prices until the service has real content */}
      <section className="hm-sec" aria-labelledby="hm-jets">
        <div className="hm-wrap">
          <div className="hm-row-head">
            <h2 className="hm-title hm-title-left" id="hm-jets" data-rv>
              <span className="hm-sticker" aria-hidden="true">
                Elite Jets
              </span>
              Private charter, arranged around you.
            </h2>
            <div className="hm-jets-side" data-rv>
              <p>Tell us where you want to fly, when, and with how many people. The team comes back with options.</p>
              <Link className="hm-btn hm-btn-primary" href="/contact?type=Booking">
                Get a charter quote
              </Link>
            </div>
          </div>
          <ul className="hm-pkgs">
            {JETS.map((jet, i) => (
              <li key={jet.title} data-rv style={{ ["--i" as string]: i }}>
                <Link href="/contact?type=Booking">
                  <img src={jet.image} alt={jet.alt} loading="lazy" decoding="async" width={900} height={jet.h} />
                  <span className="hm-chip">{jet.chip}</span>
                  <span className="hm-go" aria-hidden="true">
                    <svg viewBox="0 0 16 16">
                      <path d="M4 12 12 4M5.5 4H12v6.5" />
                    </svg>
                  </span>
                  <span className="hm-pkg-text">
                    <strong>{jet.title}</strong>
                    <span>{jet.text}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 8a. How it works: three hairline step cards, after the Elite Jets teaser, before the closing call to action */}
      <section className="hm-sec hm-sec-white" data-tone="light" aria-labelledby="hm-how">
        <div className="hm-wrap">
          <Title id="hm-how" sticker="How it works">
            Create journeys with effortless booking flow.
          </Title>
          <ol className="hm-process">
            {STEPS.map((st, i) => (
              <li key={st.title} data-rv style={{ ["--i" as string]: i }}>
                <span className="hm-process-step">Step 0{i + 1}</span>
                <p>{st.text}</p>
                <div className="hm-process-foot">
                  <h3>{st.title}</h3>
                  <Icon name={st.icon} />
                </div>
              </li>
            ))}
          </ol>
          {PARTNERS.length > 0 && <p className="hm-partners">Working with: {PARTNERS.join(", ")}.</p>}
        </div>
      </section>

      {/* 8b. Closing call to action, straight after how it works: a white band with a dark card */}
      <section className="hm-sec hm-sec-white hm-sec-flush" data-tone="light" aria-labelledby="hm-deals">
        <div className="hm-wrap">
          <div className="hm-deals" data-theme="dark">
            <div className="hm-deals-copy">
              <h2 id="hm-deals" data-rv style={{ ["--i" as string]: 0 }}>
                <span className="hm-sticker" aria-hidden="true">
                  Ready to go?
                </span>
                Tell us where, and we will price it.
              </h2>
              <p data-rv style={{ ["--i" as string]: 2 }}>
                Send us your route and dates. We come back with a price, and nothing is charged until you agree.
              </p>
              <div className="hm-actions" data-rv style={{ ["--i" as string]: 3 }}>
                <a className="hm-btn hm-btn-primary" href="/quote">
                  Get my quote
                </a>
              </div>
            </div>
            <ul className="hm-deals-photos" aria-hidden="true">
              {["dxb", "cpt", "lhr"].map((c, i) => (
                <li key={c}>
                  <img
                    src={`/images/home/route-${c}.webp`}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    width={800}
                    height={1000}
                    data-rv
                    style={{ ["--i" as string]: i + 2 }}
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 8c. FAQ, after the closing call to action */}
      <section className="hm-sec" id="faq" aria-labelledby="hm-faq">
        <div className="hm-wrap">
          <Title id="hm-faq" sticker="Questions">
            Quick answers before you ask.
          </Title>
          <div className="hm-faq">
            {FAQ.map((f, i) => (
              <details key={f.q} open={i === 0} data-rv>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 8d. Blog teaser, last before the footer: three photo cards with the title laid over them, as on the reference site */}
      <section className="hm-sec hm-sec-white" data-tone="light" aria-labelledby="hm-blog">
        <div className="hm-wrap">
          <div className="hm-row-head">
            <h2 className="hm-title hm-title-left" id="hm-blog" data-rv>
              <span className="hm-sticker" aria-hidden="true">
                Our blog
              </span>
              Guides for the routes you fly.
            </h2>
            <Link className="hm-btn hm-btn-quiet" href="/blogs">
              All blogs
            </Link>
          </div>
          <ul className="hm-pkgs hm-blog">
            {POSTS.map((post, i) => (
              <li key={post.title} data-rv style={{ ["--i" as string]: i }}>
                <Link href="/blogs">
                  <img src={post.image} alt={post.alt} loading="lazy" decoding="async" width={900} height={900} />
                  <span className="hm-go" aria-hidden="true">
                    <svg viewBox="0 0 16 16">
                      <path d="M4 12 12 4M5.5 4H12v6.5" />
                    </svg>
                  </span>
                  <span className="hm-pkg-text">
                    <span>Coming soon</span>
                    <strong>{post.title}</strong>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <ContactBar />
    </div>
  );
}
