import type { Metadata } from "next";
import Link from "next/link";
import type { PackageDetail } from "@arlink28/api-client";
import Gallery, { type GalleryImage } from "@/components/packages/Gallery";
import SectionTabs from "@/components/packages/SectionTabs";
import ProductEnquiryCard from "@/components/products/ProductEnquiryCard";
import { paragraphs } from "@/utils/packages";
import { PUBLIC, headline, notes, publicPath, specRows, type PublicType } from "@/utils/publicProducts";

/** The page's title, description and share image, the same way the holiday package page sets them. */
export function productMetadata(pkg: PackageDetail, type: PublicType): Metadata {
  const hero = pkg.media.find((m) => m.role === "Hero" && !m.videoProvider);
  const description = pkg.seoDescription ?? pkg.summary ?? pkg.subtitle ?? undefined;
  return {
    title: `${pkg.seoTitle ?? pkg.title} | ARLink28`,
    description,
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    alternates: { canonical: publicPath(type, pkg.slug) },
    openGraph: {
      title: pkg.seoTitle ?? pkg.title,
      description,
      type: "website",
      images: hero ? [{ url: hero.path, alt: hero.alt ?? pkg.title }] : undefined,
    },
  };
}

/** A flight, hotel reservation or visa page: what is on offer, the terms, and a way to enquire. */
export default function ProductDetail({ pkg, type }: { pkg: PackageDetail; type: PublicType }) {
  const copy = PUBLIC[type];

  const images: GalleryImage[] = [...pkg.media]
    .filter((m) => !m.videoProvider)
    .sort((a, b) => (a.role === "Hero" ? -1 : b.role === "Hero" ? 1 : a.sortKey - b.sortKey))
    .map((m) => ({ id: m.id, src: m.path, alt: m.alt ?? pkg.title, caption: m.caption }));

  const rows = specRows(type, pkg.details, pkg.baseCurrency);
  const extra = notes(type, pkg.details);
  const description = paragraphs(pkg.description);
  const line = headline(type, pkg.details);
  const included = pkg.features
    .filter((f) => f.section === "Included" || f.section === "Highlight" || f.section === "Perk")
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const excluded = pkg.features.filter((f) => f.section === "Excluded").sort((a, b) => a.sortOrder - b.sortOrder);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": type === "VisaSupport" ? "Service" : "Product",
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
              <Link href={copy.path}>{copy.title}</Link>
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
              {line && line !== pkg.title && <span className="pkgs-card-lodges">{line}</span>}
            </p>
          </div>
        </div>

        {images.length > 0 && <Gallery images={images} title={pkg.title} />}

        <SectionTabs
          tabs={[
            {
              id: "overview",
              label: "Overview",
              content: (
                <section className="pkgs-section" id="overview" aria-labelledby="overview-title">
                  <h2 id="overview-title">Overview</h2>
                  {pkg.summary && <p className="pkgs-lead">{pkg.summary}</p>}
                  {description.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                  {!pkg.summary && description.length === 0 && <p>Send an enquiry and we will tell you more.</p>}
                </section>
              ),
            },
            {
              id: "details",
              label: "Details",
              content: (
                <section className="pkgs-section" id="details" aria-labelledby="details-title">
                  <h2 id="details-title">Details</h2>
                  {rows.length > 0 && (
                    <dl className="pkgs-spec">
                      {rows.map((r) => (
                        <div key={r.label}>
                          <dt>{r.label}</dt>
                          <dd>{r.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                  {extra.map((n) => (
                    <div className="pkgs-spec-note" key={n.heading}>
                      <h3>{n.heading}</h3>
                      {n.text && <p>{n.text}</p>}
                      {n.items && (
                        <ul className="pkgs-checklist">
                          {n.items.map((item) => (
                            <li key={item}>
                              <i className="fa-solid fa-check" aria-hidden="true"></i>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </section>
              ),
            },
            ...(included.length > 0 || excluded.length > 0
              ? [
                  {
                    id: "included",
                    label: "What's included",
                    content: (
                      <section className="pkgs-section" id="included" aria-labelledby="included-title">
                        <h2 id="included-title">What&apos;s included</h2>
                        <div className="pkgs-included">
                          {included.length > 0 && (
                            <ul className="pkgs-checklist">
                              {included.map((f, i) => (
                                <li key={i}>
                                  <i className="fa-solid fa-check" aria-hidden="true"></i>
                                  <span>
                                    {f.label}
                                    {f.footnote && <small>{f.footnote}</small>}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                          {excluded.length > 0 && (
                            <div>
                              <h3>Not included</h3>
                              <ul className="pkgs-checklist pkgs-checklist-excluded">
                                {excluded.map((f, i) => (
                                  <li key={i}>
                                    <i className="fa-solid fa-xmark" aria-hidden="true"></i>
                                    <span>{f.label}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </section>
                    ),
                  },
                ]
              : []),
          ]}
          aside={<ProductEnquiryCard pkg={pkg} type={type} />}
        />
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
