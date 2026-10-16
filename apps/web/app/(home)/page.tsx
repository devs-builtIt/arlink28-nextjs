import type { Metadata } from "next";
import Link from "next/link";
import "../styles/home.css";

import ClosingCta from "@/components/home/ClosingCta";
import ContactBar from "@/components/home/ContactBar";
import PartnerLogos from "@/components/home/PartnerLogos";
import HeroSlides from "@/components/home/HeroSlides";
import Icon from "@/components/home/Icon";
import QuoteWidget from "@/components/home/QuoteWidget";
import Reveal from "@/components/home/Reveal";
import RouteCards from "@/components/home/RouteCards";
import FaqSection from "@/components/home/FaqSection";
import HoverList from "@/components/home/HoverList";
import StepsOnPhoto from "@/components/home/StepsOnPhoto";
import {
  FAQ,
  GOOGLE_REVIEWS_URL,
  HAPPY,
  PARTNERS,
  RATING,
  REVIEWS,
  REVIEW_BYLINE,
  REVIEW_SUMMARY,
  WHY,
} from "@/content/home-proof";
import { BLOG_TEASERS } from "@/content/blog-teasers";
import { HERO_SLIDES } from "@/content/hero-slides";
import { priceLabel } from "@/utils/packages";
import { listPackages } from "@/utils/server/catalogue";
import { loadEliteTiers } from "@/utils/server/elite";
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
    images: [
      {
        url: "/images/home/og-home.jpg",
        width: 1200,
        height: 630,
        alt: "Lantern-lit safari camp under an acacia tree at dusk",
      },
    ],
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
    text: "A member of the team replies by email or phone with options, and checks the details with you.",
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
      logo: `${SITE}/images/logo-horizontal-black.png`,
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
  const [packages, tiers] = await Promise.all([loadPackages(), loadEliteTiers()]);

  return (
    <div className="hm">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Reveal />

      {/* 1. Hero: a photo card with the quote panel docked in it */}
      <section className="hm-hero" aria-labelledby="hm-h1">
        <div className="hm-hero-card">
          <div className="hm-hero-body">
            <div className="hm-hero-copy">
              <h1 id="hm-h1">Discover the best of Africa.</h1>
              <p className="hm-hero-sub">
                Flights, hotels, visas and holidays, arranged by people who know the routes.
              </p>
              <p className="hm-rating">
                <b className="hm-rating-score">
                  {RATING.value} <span aria-hidden="true">{"★"}</span>
                </b>{" "}
                on {RATING.platform} ({RATING.count})
              </p>
            </div>
            <QuoteWidget />
          </div>
          <HeroSlides slides={HERO_SLIDES} />
        </div>
      </section>

      {/* Partner logos, a quiet strip straight after the hero */}
      <PartnerLogos />

      {/* 2. Destinations, straight after the hero, as the market leaders do */}
      <section className="hm-sec" id="destinations" aria-labelledby="hm-routes">
        <div className="hm-wrap">
          <div className="hm-row-head">
            <h2 className="hm-title hm-title-left" id="hm-routes" data-rv>
              <span className="hm-sticker" aria-hidden="true">
                Destinations
              </span>
              Trending
              <br />
              destinations
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

      {/* 6. Packages, live from the catalogue, right after the destinations: the one section with real prices, so it
          comes before the general reasons to choose us. */}
      {packages.length > 0 && (
        <section className="hm-sec hm-sec-grey" aria-labelledby="hm-pkgs">
          <div className="hm-wrap">
            <div className="hm-row-head">
              <h2 className="hm-title hm-title-left" id="hm-pkgs" data-rv>
                <span className="hm-sticker" aria-hidden="true">
                  Holidays
                </span>
                Featured
                <br />
                Packages
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

      {/* 7. Why choose us, on a white section. Under the reasons, a flat rating card. */}
      <section className="hm-sec hm-sec-white" data-tone="light" aria-labelledby="hm-why">
        <div className="hm-wrap">
          <Title id="hm-why" sticker="Why choose us?">
            One team for your
            <br />
            flight, hotel and visa.
          </Title>
          <HoverList
            items={[
              { ...WHY[0], src: "/images/home/slide-serengeti-1280.webp", pos: "50% 72%" },
              { ...WHY[1], src: "/images/home/slide-namibia-1280.webp", pos: "50% 60%" },
              { ...WHY[4], src: "/images/home/slide-knysna-1280.webp", pos: "50% 45%" },
            ]}
            cta={{ href: "/quote", label: "Get a quote" }}
          >
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
            </div>
          </HoverList>
        </div>
      </section>

      {/* 7a. Elite Jets teaser, straight after the reasons to choose us: three kinds of charter, no prices until the service has real content */}
      <section className="hm-sec" aria-labelledby="hm-jets">
        <div className="hm-wrap">
          <div className="hm-row-head">
            <h2 className="hm-title hm-title-left" id="hm-jets" data-rv>
              <span className="hm-sticker" aria-hidden="true">
                ARLink28 Elite
              </span>
              Private jet charter,
              <br />
              in three tiers.
            </h2>
            <div className="hm-jets-side" data-rv>
              <p>Three ways to fly private, from the essentials to a journey designed entirely around you.</p>
              <Link className="hm-btn hm-btn-primary" href="/elite-jets">
                See the tiers
              </Link>
            </div>
          </div>
          <ul className="hm-stack">
            {tiers.map((t, i) => (
              <li key={t.slug} data-rv style={{ ["--i" as string]: i }}>
                <div className="hm-stack-info">
                  <h3>{t.title}</h3>
                  <div className="hm-stack-copy">
                    <p>{t.tagline}</p>
                    <Link className="hm-btn hm-btn-primary" href={`/elite-jets#${t.slug}`}>
                      Explore {t.tier}
                    </Link>
                  </div>
                </div>
                <div className="hm-stack-photo">
                  <img src={t.image} alt={t.alt} loading="lazy" decoding="async" width={1600} height={1200} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 7b. Reviews, after the Elite teaser: a split heading, then three panels in one row. A rating card on the left,
          a photo with one featured quote in the middle, and a single column of review cards scrolling slowly on the
          right. Review text is placeholder until real. */}
      <section className="hm-sec hm-sec-white" data-tone="light" aria-labelledby="hm-reviews">
        <div className="hm-wrap">
          <div className="hm-row-head hm-rv-head">
            <h2 className="hm-title hm-title-left" id="hm-reviews" data-rv>
              <span className="hm-sticker" aria-hidden="true">
                Happy travellers
              </span>
              What travellers
              <br />
              say about us.
            </h2>
            <p data-rv>Every booking is checked by a person, from the first message to the day you fly.</p>
          </div>
          <div className="hm-rv">
            <div className="hm-rv-stats" data-rv>
              <div className="hm-rv-rating">
                <b>
                  {REVIEW_SUMMARY.score}
                  <small>/5</small>
                </b>
                <p>{REVIEW_SUMMARY.basis}</p>
              </div>
              <ul className="hm-rv-facts">
                <li>
                  <Icon name="person" />
                  {HAPPY.value} {HAPPY.label.toLowerCase()}
                </li>
                <li>
                  <Icon name="message" />A person replies, never a bot
                </li>
                <li>
                  <Icon name="shield" />
                  Nothing is charged until you agree
                </li>
              </ul>
              <div className="hm-rv-cta">
                <p>
                  Ready to plan your own journey?
                  <br />
                  <b>Let&rsquo;s get started.</b>
                </p>
                <div className="hm-rv-btns">
                  <Link className="hm-btn hm-btn-primary" href="/quote">
                    Get a quote
                  </Link>
                  <a
                    className="hm-rv-go"
                    href={GOOGLE_REVIEWS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Read all reviews on Google"
                  >
                    <svg viewBox="0 0 16 16" aria-hidden="true">
                      <path d="M4 12 12 4M5.5 4H12v6.5" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
            <figure className="hm-rv-feature" data-rv style={{ ["--i" as string]: 1 }}>
              <img
                src="/images/home/review-pool-1600.webp"
                srcSet="/images/home/review-pool-1000.webp 1000w, /images/home/review-pool-1600.webp 1600w, /images/home/review-pool-2160.webp 2160w"
                sizes="(max-width: 1024px) 100vw, 40vw"
                alt="A woman in a sun hat resting at the edge of an infinity pool above a wide bush valley"
                loading="lazy"
                decoding="async"
                width={2160}
                height={1440}
              />
              <figcaption>
                <blockquote>{REVIEWS[0].text}</blockquote>
                <cite>
                  {REVIEWS[0].title}, {REVIEW_BYLINE}
                </cite>
              </figcaption>
            </figure>
            <div className="hm-rv-col" data-rv style={{ ["--i" as string]: 2 }}>
              <div className="hm-rv-track">
                {[0, 1].map((copy) => (
                  <ul key={copy} aria-hidden={copy === 1 ? "true" : undefined}>
                    {REVIEWS.slice(1).map((r, i) => (
                      <li key={i} className="hm-rv-card">
                        <span className="hm-stars" aria-hidden="true">
                          {"★★★★★"}
                        </span>
                        <blockquote>{r.text}</blockquote>
                        <footer>
                          <span>
                            <strong>{r.title}</strong>
                            <small>{REVIEW_BYLINE}</small>
                          </span>
                        </footer>
                      </li>
                    ))}
                  </ul>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8a. How it works: a full-bleed photo with the three step cards over it, before the FAQ */}
      <StepsOnPhoto
        id="hm-how"
        heading={
          <>
            Three steps from
            <br />
            request to booking.
          </>
        }
        steps={STEPS}
        photo="/images/home/slide-serengeti-1920.webp"
        focus="50% 72%"
        cta={{ href: "/quote", label: "Get a quote" }}
      >
        {PARTNERS.length > 0 && <p className="hm-partners">Working with: {PARTNERS.join(", ")}.</p>}
      </StepsOnPhoto>

      {/* 8b. FAQ, after how it works */}
      <FaqSection items={FAQ} schema={false} />

      {/* 8d. Blog teaser, after the FAQ: three photo cards with the title laid over them, as on the reference site */}
      <section className="hm-sec hm-sec-white" data-tone="light" aria-labelledby="hm-blog">
        <div className="hm-wrap">
          <div className="hm-row-head">
            <h2 className="hm-title hm-title-left" id="hm-blog" data-rv>
              <span className="hm-sticker" aria-hidden="true">
                Our blog
              </span>
              Guides for the
              <br />
              routes you fly.
            </h2>
            <Link className="hm-btn hm-btn-quiet" href="/blogs">
              All blogs
            </Link>
          </div>
          <ul className="hm-pkgs hm-blog">
            {BLOG_TEASERS.map((post, i) => (
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

      {/* 8e. Closing call to action, last before the contact bar: a white band with a dark card */}
      <ClosingCta bleed />

      <ContactBar />
    </div>
  );
}
