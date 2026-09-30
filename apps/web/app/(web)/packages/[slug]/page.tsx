import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import type { PackageDetail, PackageFeature } from "@arlink28/api-client";
import Gallery, { type GalleryImage } from "@/components/packages/Gallery";
import SectionTabs from "@/components/packages/SectionTabs";
import BookingCard from "@/components/packages/BookingCard";
import ReviewsSection from "@/components/packages/ReviewsSection";
import { publicPath } from "@/utils/publicProducts";
import { getPackage } from "@/utils/server/catalogue";
import { isUploaded, testPhotosEnabled, testPhotosFor } from "@/utils/testPhotos";
import {
  categoryLabel,
  nightsLabel,
  paragraphs,
  partyLabel,
  priceLabel,
  rangeLabel,
  unitLabel,
} from "@/utils/packages";
import "../../styles/packages.css";

type Params = { params: { slug: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const pkg = await getPackage(params.slug).catch(() => null);
  if (!pkg) return { title: "Package not found | ARLink28" };
  if (pkg.productType && pkg.productType !== "HolidayPackage") return { title: `${pkg.title} | ARLink28` };
  const hero = pkg.media.find((m) => m.role === "Hero" && !m.videoProvider);
  const description = pkg.seoDescription ?? pkg.summary ?? pkg.subtitle ?? undefined;
  return {
    title: `${pkg.seoTitle ?? pkg.title} | ARLink28`,
    description,
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    alternates: { canonical: `/packages/${pkg.slug}` },
    openGraph: {
      title: pkg.seoTitle ?? pkg.title,
      description,
      type: "website",
      images: hero ? [{ url: hero.path, alt: hero.alt ?? pkg.title }] : undefined,
    },
  };
}

// Where each kind of line is shown, and what it is called. Highlights sit in the overview.
const INCLUDED_GROUPS: [string, string][] = [
  ["Included", "Included in the price"],
  ["PremiumService", "ARLink28 premium services"],
  ["Vehicle", "Vehicle"],
  ["Perk", "Perks"],
];

function FeatureList({ items, excluded = false }: { items: PackageFeature[]; excluded?: boolean }) {
  return (
    <ul className={`pkgs-checklist${excluded ? " pkgs-checklist-excluded" : ""}`}>
      {items.map((f, i) => (
        <li key={i}>
          <i
            className={`fa-solid ${excluded ? "fa-xmark" : f.icon ? `fa-${f.icon}` : "fa-check"}`}
            aria-hidden="true"
          ></i>
          <span>
            {f.label}
            {f.footnote && <small>{f.footnote}</small>}
          </span>
        </li>
      ))}
    </ul>
  );
}

const inSection = (pkg: PackageDetail, section: string) =>
  pkg.features.filter((f) => f.section === section).sort((a, b) => a.sortOrder - b.sortOrder);

export default async function PackagePage({ params }: Params) {
  const pkg = await getPackage(params.slug).catch(() => {
    throw new Error("The package could not be loaded.");
  });
  if (!pkg) notFound();
  // A flight, hotel or visa that was opened here belongs at its own address.
  if (pkg.productType && pkg.productType !== "HolidayPackage") permanentRedirect(publicPath(pkg.productType, pkg.slug));

  // The hero first, then the gallery in order, then the poster. Videos are not shown yet.
  const ownImages: GalleryImage[] = [...pkg.media]
    .filter((m) => !m.videoProvider)
    .sort((a, b) =>
      a.role === "Hero"
        ? -1
        : b.role === "Hero"
          ? 1
          : a.role === "Poster"
            ? 1
            : b.role === "Poster"
              ? -1
              : a.sortKey - b.sortKey,
    )
    .map((m) => ({
      id: m.id,
      src: m.path,
      alt: m.alt ?? pkg.title,
      caption: m.caption,
      label: m.role === "Poster" ? "Original poster" : undefined,
    }));

  // While packages have no real photography (see utils/testPhotos.ts): a package with no uploaded
  // photo gets stock photos in front, and any poster that came with the site goes last. A package
  // that has photos (the admin's, or the seeded test photos) shows those as they are.
  const images: GalleryImage[] =
    testPhotosEnabled() && !ownImages.some((i) => isUploaded(i.src))
      ? [
          ...testPhotosFor(pkg.slug, pkg.destination.slug, { count: 6, width: 1400 }).map((p, i) => ({
            id: `test-${i}`,
            src: p.src,
            alt: p.alt,
            label: "Test photo",
          })),
          ...ownImages.filter((i) => isUploaded(i.src)),
          ...ownImages.filter((i) => !isUploaded(i.src)).map((i) => ({ ...i, label: "Original poster" })),
        ]
      : ownImages;

  const highlights = inSection(pkg, "Highlight");
  const excluded = inSection(pkg, "Excluded");
  const notes = inSection(pkg, "Note");
  const description = paragraphs(pkg.description);
  const stays = [...pkg.stays].sort((a, b) => a.sortOrder - b.sortOrder);
  const basis = pkg.pricingBasis === "PerPerson" ? "per person" : "per party";
  const coverage = pkg.rates.flatMap((r) => r.ranges ?? []);
  const extraNightsSold = pkg.rates.some((r) => r.extraNightPriceMinor != null);
  const hasIncluded = INCLUDED_GROUPS.some(([s]) => inSection(pkg, s).length > 0) || excluded.length > 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: pkg.title,
    description: pkg.summary ?? pkg.subtitle ?? undefined,
    image: images[0]?.src,
    ...(pkg.fromPriceMinor != null && {
      offers: { "@type": "Offer", price: (pkg.fromPriceMinor / 100).toFixed(2), priceCurrency: pkg.baseCurrency },
    }),
  };

  return (
    <>
      <div className="pkgs-topband">
        <nav className="pkgs-breadcrumb" aria-label="Breadcrumb">
          <ol>
            <li>
              <Link href="/">Home</Link>
            </li>
            <li>
              <Link href="/packages">Packages</Link>
            </li>
            <li>
              <span aria-current="page">{pkg.title}</span>
            </li>
          </ol>
        </nav>
      </div>

      <div className="pkgs-detail">
        <div className="pkgs-detail-head">
          <div>
            <h1>{pkg.title}</h1>
            {pkg.subtitle && <p className="pkgs-detail-sub">{pkg.subtitle}</p>}
            <p className="pkgs-card-place">
              <i className="fa-solid fa-location-dot" aria-hidden="true"></i>
              {pkg.destination.name}, {pkg.destination.country}
              {stays.length > 0 && (
                <span className="pkgs-card-lodges">{[...new Set(stays.map((s) => s.propertyName))].join(", ")}</span>
              )}
            </p>
          </div>
        </div>

        <Gallery images={images} title={pkg.title} />

        <SectionTabs
          tabs={[
            {
              id: "overview",
              label: "Overview",
              content: (
                <section className="pkgs-section" id="overview" aria-labelledby="overview-title">
                  <h2 id="overview-title">Overview</h2>
                  <dl className="pkgs-keyfacts">
                    <div>
                      <dt>Length</dt>
                      <dd>{nightsLabel(pkg.nights)}</dd>
                    </div>
                    <div>
                      <dt>Party</dt>
                      <dd>{partyLabel(pkg.adults, pkg.children)}</dd>
                    </div>
                    <div>
                      <dt>Type</dt>
                      <dd>{categoryLabel(pkg.category)}</dd>
                    </div>
                    <div>
                      <dt>Shortest stay</dt>
                      <dd>{nightsLabel(pkg.minNights)}</dd>
                    </div>
                  </dl>

                  {pkg.summary && <p className="pkgs-lead">{pkg.summary}</p>}
                  {description.slice(0, 2).map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                  {description.length > 2 && (
                    <details className="pkgs-more">
                      <summary>Read more</summary>
                      {description.slice(2).map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                    </details>
                  )}

                  {highlights.length > 0 && (
                    <div className="pkgs-highlight-box">
                      <h3>Highlights</h3>
                      <FeatureList items={highlights} />
                    </div>
                  )}
                </section>
              ),
            },
            ...(stays.length > 0
              ? [
                  {
                    id: "stays",
                    label: "Where you stay",
                    content: (
                      <section className="pkgs-section" id="stays" aria-labelledby="stays-title">
                        <h2 id="stays-title">Where you stay</h2>
                        <ol className="pkgs-stays">
                          {stays.map((s) => (
                            <li key={s.id}>
                              <span className="pkgs-stay-nights">{nightsLabel(s.nights)}</span>
                              <div>
                                <h3>{s.propertyName}</h3>
                                <p>{[s.destinationName, s.roomType].filter(Boolean).join(", ")}</p>
                              </div>
                            </li>
                          ))}
                        </ol>
                      </section>
                    ),
                  },
                ]
              : []),
            ...(hasIncluded
              ? [
                  {
                    id: "included",
                    label: "What's included",
                    content: (
                      <section className="pkgs-section" id="included" aria-labelledby="included-title">
                        <h2 id="included-title">What&apos;s included</h2>
                        <div className="pkgs-included">
                          {INCLUDED_GROUPS.map(([section, heading]) => {
                            const items = inSection(pkg, section);
                            return items.length > 0 ? (
                              <div key={section}>
                                <h3>{heading}</h3>
                                <FeatureList items={items} />
                              </div>
                            ) : null;
                          })}
                          {excluded.length > 0 && (
                            <div>
                              <h3>Not included</h3>
                              <FeatureList items={excluded} excluded />
                            </div>
                          )}
                        </div>
                        {notes.length > 0 && (
                          <ul className="pkgs-notes">
                            {notes.map((n, i) => (
                              <li key={i}>{n.label}</li>
                            ))}
                          </ul>
                        )}
                      </section>
                    ),
                  },
                ]
              : []),
            {
              id: "prices",
              label: "Prices",
              content: (
                <section className="pkgs-section" id="prices" aria-labelledby="prices-title">
                  <h2 id="prices-title">Prices</h2>
                  {pkg.rates.length === 0 ? (
                    <p>Prices for this package are on request.</p>
                  ) : (
                    <div className="pkgs-table-wrap">
                      <table className="pkgs-table">
                        <caption>
                          Price {basis} for {nightsLabel(pkg.nights)}, by check-in date
                        </caption>
                        <thead>
                          <tr>
                            <th scope="col">Season</th>
                            <th scope="col">Check-in dates</th>
                            <th scope="col" className="pkgs-num">
                              Package price
                            </th>
                            <th scope="col" className="pkgs-num">
                              Each extra night
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {pkg.rates.map((r) => (
                            <tr key={`${r.seasonSlug}-${r.currency}`}>
                              <th scope="row">{r.seasonName}</th>
                              <td>
                                {(r.ranges ?? []).map((range) => (
                                  <span key={range.start}>{rangeLabel(range.start, range.end)}</span>
                                ))}
                              </td>
                              <td className="pkgs-num">{priceLabel(r.priceMinor, r.currency)}</td>
                              <td className="pkgs-num">
                                {r.extraNightPriceMinor != null
                                  ? priceLabel(r.extraNightPriceMinor, r.currency)
                                  : "Not sold"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {pkg.addOns.length > 0 && (
                    <>
                      <h3 className="pkgs-subhead">Add-ons</h3>
                      <ul className="pkgs-addons">
                        {pkg.addOns.map((a) => (
                          <li key={a.id}>
                            <span>
                              {a.name}
                              {a.description && <small>{a.description}</small>}
                            </span>
                            <span className="pkgs-addon-price">
                              {priceLabel(a.priceMinor, a.currency)} <small>{unitLabel(a.unit)}</small>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </section>
              ),
            },
            { id: "reviews", label: "Reviews", content: <ReviewsSection /> },
          ]}
          aside={
            <BookingCard
              slug={pkg.slug}
              title={pkg.title}
              nights={pkg.nights}
              adults={pkg.adults}
              children={pkg.children}
              currency={pkg.baseCurrency}
              pricingBasis={pkg.pricingBasis}
              fromPriceMinor={pkg.fromPriceMinor ?? null}
              addOns={pkg.addOns}
              extraNightsSold={extraNightsSold}
              coverage={coverage}
            />
          }
        />
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
