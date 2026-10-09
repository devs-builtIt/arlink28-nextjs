import type { Metadata } from "next";
import Link from "next/link";
import DestinationTile from "@/components/destinations/DestinationTile";
import { groupByCountry, placeHref } from "@/utils/destinations";
import { listDestinations } from "@/utils/server/catalogue";
import "../../styles/destination-pages.css";
import PageBanner from "@/components/PageBanner";

export const metadata: Metadata = {
  title: "Destinations across Africa | ARLink28",
  description:
    "Where ARLink28 can take you: Victoria Falls, Botswana, Egypt and more. Pick a country, read about the places worth the trip, and see the packages that go there.",
  alternates: { canonical: "/destinations" },
};

// Rendered on request, so a build made while the API is down never bakes in the error state. The API data
// itself is still cached for five minutes (see utils/server/catalogue.ts).
export const dynamic = "force-dynamic";

export default async function DestinationsPage() {
  const destinations = await listDestinations().catch(() => null);
  const groups = destinations ? groupByCountry(destinations) : [];

  return (
    <>
      <PageBanner
        title="Destinations"
        intro="Where ARLink28 can take you across Africa. Choose a country, or go straight to a place."
      />

      <div className="dst-page">
        {destinations === null ? (
          <div className="dst-empty">
            <h2>Destinations can&apos;t be shown right now</h2>
            <p>Something went wrong on our side. Reload the page in a moment.</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="dst-empty">
            <h2>Destinations are being added</h2>
            <p>We are writing up the places we fly to. In the meantime you can browse every package.</p>
            <Link className="dst-button" href="/packages">
              See all packages
            </Link>
          </div>
        ) : (
          <>
            {groups.length > 1 && (
              <nav className="dst-jump" aria-label="Countries">
                <ul>
                  {groups.map((g) => (
                    <li key={g.code}>
                      <a href={`#${g.code.toLowerCase()}`}>{g.name}</a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}

            {groups.map((g, groupIndex) => (
              <section className="dst-country" key={g.code} id={g.code.toLowerCase()} aria-labelledby={`dst-${g.code}`}>
                <div className="dst-country-head">
                  <h2 id={`dst-${g.code}`}>
                    {g.country ? <Link href={`/destinations/${g.country.slug}`}>{g.name}</Link> : g.name}
                  </h2>
                  {g.country?.summary && <p>{g.country.summary}</p>}
                </div>

                {g.featured.length > 0 && (
                  <div className={`dst-tiles${g.featured.length >= 3 ? " dst-tiles-lead" : ""}`}>
                    {g.featured.map((d, i) => (
                      <DestinationTile key={d.id} place={d} priority={groupIndex === 0 && i < 2} />
                    ))}
                  </div>
                )}

                {g.others.length > 0 && (
                  <p className="dst-others">
                    <span>{g.featured.length > 0 ? "Also on our packages:" : "On our packages:"}</span>{" "}
                    {g.others.map((d, i) => (
                      <span key={d.id}>
                        {i > 0 && ", "}
                        <Link href={placeHref(d)}>{d.name}</Link>
                      </span>
                    ))}
                  </p>
                )}
              </section>
            ))}
          </>
        )}
      </div>
    </>
  );
}
