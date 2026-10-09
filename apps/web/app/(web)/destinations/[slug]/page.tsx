import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import DestinationTile from "@/components/destinations/DestinationTile";
import PackageCard from "@/components/packages/PackageCard";
import { safeJson } from "@/utils/destinations";
import { paragraphs } from "@/utils/packages";
import { getDestination, listPackages } from "@/utils/server/catalogue";
import "../../styles/packages.css";
import "../../styles/destination-pages.css";

type Params = { params: { slug: string } };

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const d = await getDestination(params.slug).catch(() => null);
  if (!d) return { title: "Destination not found | ARLink28" };
  const description = d.summary ?? d.tagline ?? undefined;
  return {
    title: `${d.name} | ARLink28`,
    description,
    metadataBase: new URL(SITE),
    alternates: { canonical: `/destinations/${d.slug}` },
    openGraph: {
      title: d.name,
      description,
      type: "website",
      images: d.heroPath ? [{ url: d.heroPath, alt: d.heroAlt ?? d.name }] : undefined,
    },
  };
}

export default async function DestinationPage({ params }: Params) {
  const d = await getDestination(params.slug).catch(() => null);
  if (!d) notFound();

  // Packages for this place, or for any place inside it when this is a country. A failure only hides the section.
  const packages = await listPackages({ destination: d.slug, size: 6 }).catch(() => null);
  const isCountry = d.kind === "Country";
  const body = paragraphs(d.description);
  const withPhoto = d.places.filter((p) => p.heroPath);
  const withoutPhoto = d.places.filter((p) => !p.heroPath);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": isCountry ? "Country" : "TouristDestination",
      name: d.name,
      description: d.summary ?? d.tagline ?? undefined,
      url: `${SITE}/destinations/${d.slug}`,
      image: d.heroPath ? `${SITE}${d.heroPath}` : undefined,
      ...(d.parent ? { containedInPlace: { "@type": "Country", name: d.parent.name } } : {}),
      ...(d.latitude != null && d.longitude != null
        ? { geo: { "@type": "GeoCoordinates", latitude: d.latitude, longitude: d.longitude } }
        : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Destinations", item: `${SITE}/destinations` },
        ...(d.parent
          ? [{ "@type": "ListItem", position: 2, name: d.parent.name, item: `${SITE}/destinations/${d.parent.slug}` }]
          : []),
        { "@type": "ListItem", position: d.parent ? 3 : 2, name: d.name },
      ],
    },
  ];

  return (
    <>
      <div className="pkgs-topband">
        <nav className="pkgs-breadcrumb" aria-label="Breadcrumb">
          <ol>
            <li>
              <Link href="/destinations">Destinations</Link>
            </li>
            {d.parent && (
              <li>
                <Link href={`/destinations/${d.parent.slug}`}>{d.parent.name}</Link>
              </li>
            )}
            <li aria-current="page">{d.name}</li>
          </ol>
        </nav>
      </div>

      <article className="dst-detail">
        <header className="dst-intro">
          <h1>{d.name}</h1>
          {d.tagline && <p className="dst-tagline">{d.tagline}</p>}
        </header>

        {d.heroPath && (
          <figure className="dst-hero-figure">
            <img src={d.heroPath} alt={d.heroAlt ?? d.name} decoding="async" width={1600} height={900} />
            {d.heroCredit && <figcaption>{d.heroCredit}</figcaption>}
          </figure>
        )}

        <div className="dst-columns">
          <div className="dst-main">
            {d.summary && <p className="dst-summary">{d.summary}</p>}
            {body.map((text, i) => (
              <p key={i}>{text}</p>
            ))}

            {d.attractions.length > 0 && (
              <section aria-labelledby="dst-things">
                <h2 id="dst-things">Things to do</h2>
                <ul className="dst-things">
                  {d.attractions.map((a) => (
                    <li key={a.id}>
                      {a.photoPath && (
                        <figure>
                          <img
                            src={a.photoPath}
                            alt={a.photoAlt ?? a.name}
                            loading="lazy"
                            decoding="async"
                            width={640}
                            height={480}
                          />
                          {a.photoCredit && <figcaption>{a.photoCredit}</figcaption>}
                        </figure>
                      )}
                      <div>
                        <h3>{a.name}</h3>
                        {a.summary && <p>{a.summary}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <aside className="dst-aside" aria-label="About this destination">
            <dl>
              <div>
                <dt>{isCountry ? "Country" : "Where"}</dt>
                <dd>{d.parent ? `${d.name}, ${d.parent.name}` : d.name}</dd>
              </div>
              {d.bestTimeToVisit && (
                <div>
                  <dt>Best time to visit</dt>
                  <dd>{d.bestTimeToVisit}</dd>
                </div>
              )}
            </dl>
            <Link className="dst-button" href={`/packages?destination=${encodeURIComponent(d.slug)}`}>
              See packages
            </Link>
            <Link className="dst-button dst-button-quiet" href={`/contact?destination=${encodeURIComponent(d.slug)}`}>
              Ask us about {d.name}
            </Link>
          </aside>
        </div>

        {isCountry && d.places.length > 0 && (
          <section className="dst-section" aria-labelledby="dst-places">
            <h2 id="dst-places">Places in {d.name}</h2>
            {withPhoto.length > 0 && (
              <div className={`dst-tiles${withPhoto.length >= 3 ? " dst-tiles-lead" : ""}`}>
                {withPhoto.map((p) => (
                  <DestinationTile key={p.id} place={p} />
                ))}
              </div>
            )}
            {withoutPhoto.length > 0 && (
              <p className="dst-others">
                {withoutPhoto.map((p, i) => (
                  <span key={p.id}>
                    {i > 0 && ", "}
                    <Link href={`/packages?destination=${encodeURIComponent(p.slug)}`}>{p.name}</Link>
                  </span>
                ))}
              </p>
            )}
          </section>
        )}
      </article>

      <section className="pkgs-page dst-packages" aria-labelledby="dst-packages">
        <h2 id="dst-packages">Packages in {d.name}</h2>
        {packages && packages.items.length > 0 ? (
          <>
            <div className="pkgs-grid">
              {packages.items.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} />
              ))}
            </div>
            {(packages.total ?? packages.items.length) > packages.items.length && (
              <p className="dst-more">
                <Link href={`/packages?destination=${encodeURIComponent(d.slug)}`}>
                  See all {packages.total} packages in {d.name}
                </Link>
              </p>
            )}
          </>
        ) : (
          <p className="dst-nopackages">
            We have no packages listed for {d.name} yet. Tell us what you have in mind and we will put one together.{" "}
            <Link href={`/contact?destination=${encodeURIComponent(d.slug)}`}>Contact us</Link>.
          </p>
        )}
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(jsonLd) }} />
    </>
  );
}
