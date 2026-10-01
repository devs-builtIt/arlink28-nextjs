import type { Metadata } from "next";
import Link from "next/link";
import KindSwitcher from "@/components/products/KindSwitcher";
import HeroSearch from "@/components/packages/HeroSearch";
import { ListingProvider, type ListingParams } from "@/components/packages/ListingContext";
import PackageCard from "@/components/packages/PackageCard";
import Pagination from "@/components/packages/Pagination";
import ResultsBar, { ResultsFrame } from "@/components/packages/ResultsBar";
import { PAGE_SIZE, listDestinations, listPackages } from "@/utils/server/catalogue";
import "../styles/packages.css";

export const metadata: Metadata = {
  title: "Holiday packages | ARLink28",
  description:
    "Safari and lodge packages across Africa with the price up front. See what is included and get a price for your dates.",
};

type SearchParams = Record<string, string | string[] | undefined>;
const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

// The partners a link can filter by, with their names. Anything else shows its slug.
const PARTNERS: Record<string, string> = { "giraffe-manor": "Giraffe Manor" };

export default async function PackagesPage({ searchParams }: { searchParams: SearchParams }) {
  const params: ListingParams = {
    destination: one(searchParams.destination),
    category: one(searchParams.category),
    partner: one(searchParams.partner),
    adults: one(searchParams.adults),
    sort: one(searchParams.sort),
    q: one(searchParams.q),
  };
  const page = Math.max(1, Number.parseInt(one(searchParams.page), 10) || 1);
  // Twelve to a page. The address can ask for fewer or more (4 to 48), for links that want to.
  const size = Math.min(48, Math.max(4, Number.parseInt(one(searchParams.size), 10) || PAGE_SIZE));

  const [list, destinations] = await Promise.all([
    listPackages({
      destination: params.destination,
      category: params.category,
      partner: params.partner,
      adults: params.adults ? Number(params.adults) : undefined,
      sort: params.sort,
      q: params.q,
      page,
      size,
    }).catch(() => null),
    listDestinations().catch(() => []),
  ]);

  const hrefFor = (n: number) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (value) query.set(key, value);
    if (size !== PAGE_SIZE) query.set("size", String(size));
    if (n > 1) query.set("page", String(n));
    const qs = query.toString();
    return qs ? `/packages?${qs}` : "/packages";
  };

  return (
    <ListingProvider params={params}>
      <section className="pkgs-hero">
        <div className="pkgs-hero-inner">
          <KindSwitcher active="/packages" />
          <h1>Find your next safari</h1>
          <p>Safari and lodge packages across Africa, with the price up front.</p>
        </div>
      </section>

      <div className="pkgs-searchwrap">
        <HeroSearch destinations={destinations} />
      </div>

      <div className="pkgs-page">
        <ResultsBar total={list?.total ?? null} destinations={destinations} partnerName={PARTNERS[params.partner]} />
        <ResultsFrame>
          {list === null ? (
            <div className="pkgs-empty">
              <h2>Packages can&apos;t be shown right now</h2>
              <p>Something went wrong on our side. Reload the page in a moment.</p>
            </div>
          ) : list.items.length === 0 ? (
            <div className="pkgs-empty">
              <h2>No packages found</h2>
              <p>Nothing matches these filters. Try removing one, or search for something broader.</p>
              <Link className="pkgs-button" href="/packages">
                Clear all filters
              </Link>
            </div>
          ) : (
            <>
              <div className="pkgs-grid">
                {list.items.map((pkg, i) => (
                  <PackageCard key={pkg.id} pkg={pkg} priority={i < 4} />
                ))}
              </div>
              <Pagination page={page} pageSize={size} total={list.total ?? list.items.length} hrefFor={hrefFor} />
            </>
          )}
        </ResultsFrame>
      </div>
    </ListingProvider>
  );
}
