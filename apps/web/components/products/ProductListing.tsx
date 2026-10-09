import Link from "next/link";
import { ListingProvider, type ListingParams } from "@/components/packages/ListingContext";
import Pagination from "@/components/packages/Pagination";
import ResultsBar, { ResultsFrame } from "@/components/packages/ResultsBar";
import KindSwitcher from "@/components/products/KindSwitcher";
import ProductCard from "@/components/products/ProductCard";
import ProductSearch from "@/components/products/ProductSearch";
import { PAGE_SIZE, listDestinations, listPackages } from "@/utils/server/catalogue";
import { PUBLIC, type PublicType } from "@/utils/publicProducts";
import PageBanner from "@/components/PageBanner";

type SearchParams = Record<string, string | string[] | undefined>;
const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

const SORTS: [string, string][] = [
  ["", "Featured first"],
  ["price", "Price, lowest first"],
  ["-price", "Price, highest first"],
];

/** The list page for flights, hotels or visas: the same look and behaviour as the holiday packages list. */
export default async function ProductListing({ type, searchParams }: { type: PublicType; searchParams: SearchParams }) {
  const copy = PUBLIC[type];
  const params: ListingParams = {
    destination: one(searchParams.destination),
    category: "",
    partner: "",
    adults: "",
    sort: one(searchParams.sort),
    q: one(searchParams.q),
  };
  const page = Math.max(1, Number.parseInt(one(searchParams.page), 10) || 1);
  const filtered = !!(params.q || params.destination);

  const [list, destinations] = await Promise.all([
    listPackages({ type, destination: params.destination, sort: params.sort, q: params.q, page }).catch(() => null),
    listDestinations().catch(() => []),
  ]);

  const hrefFor = (n: number) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (value) query.set(key, value);
    if (n > 1) query.set("page", String(n));
    const qs = query.toString();
    return qs ? `${copy.path}?${qs}` : copy.path;
  };

  return (
    <ListingProvider params={params}>
      <PageBanner overlap above={<KindSwitcher active={copy.path} />} title={copy.heroTitle} intro={copy.heroText} />

      <div className="pkgs-searchwrap">
        <ProductSearch destinations={destinations} placeholder={copy.searchHint} label={copy.plural} />
      </div>

      <div className="pkgs-page">
        <ResultsBar
          total={list?.total ?? null}
          destinations={destinations}
          noun={[copy.noun, copy.plural]}
          sorts={SORTS}
        />
        <ResultsFrame>
          {list === null ? (
            <div className="pkgs-empty">
              <h2>{copy.title} can&apos;t be shown right now</h2>
              <p>Something went wrong on our side. Reload the page in a moment.</p>
            </div>
          ) : list.items.length === 0 ? (
            <div className="pkgs-empty">
              <h2>{filtered ? `No ${copy.plural} found` : `No ${copy.plural} listed yet`}</h2>
              <p>
                {filtered
                  ? "Nothing matches these filters. Try removing one, or search for something broader."
                  : "We add new ones often. In the meantime, tell us what you need and we will find it."}
              </p>
              <Link className="pkgs-button" href={filtered ? copy.path : "/contact?type=Booking"}>
                {filtered ? "Clear all filters" : "Contact us"}
              </Link>
            </div>
          ) : (
            <>
              <div className="pkgs-grid">
                {list.items.map((pkg, i) => (
                  <ProductCard key={pkg.id} pkg={pkg} type={type} priority={i < 4} />
                ))}
              </div>
              <Pagination page={page} pageSize={PAGE_SIZE} total={list.total ?? list.items.length} hrefFor={hrefFor} />
            </>
          )}
        </ResultsFrame>
      </div>
    </ListingProvider>
  );
}
