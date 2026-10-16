import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import ProductDetail, { productMetadata } from "@/components/products/ProductDetail";
import { getPackage } from "@/utils/server/catalogue";
import { PUBLIC, publicPath, type PublicType } from "@/utils/publicProducts";

/** Sends a listing that was opened at the wrong kind's address to its own. */
function fetchFor(type: PublicType, slug: string) {
  return getPackage(slug).then((pkg) => {
    // The API always says what a listing is; a missing type is a holiday package, the original kind.
    const kind = pkg?.productType ?? "HolidayPackage";
    if (pkg && kind !== type) permanentRedirect(publicPath(kind, slug));
    return pkg;
  });
}

export async function productPageMetadata(type: PublicType, slug: string): Promise<Metadata> {
  const pkg = await fetchFor(type, slug).catch((err) => {
    // A redirect is thrown as an error: let it through.
    if (isRedirect(err)) throw err;
    return null;
  });
  if (!pkg) return { title: `${PUBLIC[type].title} | ARLink28` };
  return productMetadata(pkg, type);
}

export async function ProductPage({ type, slug }: { type: PublicType; slug: string }) {
  const pkg = await fetchFor(type, slug).catch((err) => {
    if (isRedirect(err)) throw err;
    throw new Error("This page could not be loaded.");
  });
  if (!pkg) notFound();
  return <ProductDetail pkg={pkg} type={type} />;
}

/**
 * Called from the layout of a listing's address, before anything is sent. The status code is fixed once the first
 * bytes go out, and each of these routes has a loading.tsx that sends them before the page runs, so a listing that
 * does not exist would be a "soft 404" (a 200 that says "not found") and a wrong-kind address would redirect in
 * the browser instead of with a 308. A layout renders ahead of that loading boundary, so it can still answer 404
 * and 308. If the catalogue cannot be reached it lets the page through, so an outage is not mistaken for a 404.
 */
export async function guardListing(type: PublicType | "HolidayPackage", slug: string) {
  const pkg = await getPackage(slug).catch(() => undefined);
  if (pkg === undefined) return;
  if (pkg === null) notFound();
  const kind = pkg.productType ?? "HolidayPackage";
  if (kind !== type) permanentRedirect(publicPath(kind, slug));
}

/** Next's redirect() throws an error whose digest starts with NEXT_REDIRECT. */
const isRedirect = (err: unknown) =>
  typeof err === "object" && err !== null && String((err as { digest?: unknown }).digest).startsWith("NEXT_REDIRECT");

/** What to show when a flight, hotel or visa isn't there (or is no longer published). */
export function ProductNotFound({ type }: { type: PublicType }) {
  const copy = PUBLIC[type];
  return (
    <>
      <div className="pkgs-topband" />
      <div className="pkgs-detail">
        <div className="pkgs-empty">
          <h1>This {copy.noun} isn&apos;t available</h1>
          <p>It may have been taken off the site, or the address may be wrong. You can browse what is listed now.</p>
          <Link className="pkgs-button" href={copy.path}>
            See all {copy.plural}
          </Link>
        </div>
      </div>
    </>
  );
}

/** The list's shape while it loads: the hero and search bar, then a grid of quiet placeholder cards. */
export function ListingSkeleton({ type }: { type: PublicType }) {
  const copy = PUBLIC[type];
  return (
    <>
      <section className="pkgs-hero">
        <div className="pkgs-hero-inner">
          <h1>{copy.heroTitle}</h1>
          <p>{copy.heroText}</p>
        </div>
      </section>
      <div className="pkgs-searchwrap" aria-hidden="true">
        <div className="pkgs-search pkgs-search-skeleton"></div>
      </div>
      <div className="pkgs-page" role="status" aria-label={`Loading ${copy.plural}`}>
        <div className="pkgs-grid" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <article className="pkgs-card" key={i}>
              <span className="pkgs-card-media pkgs-sk" />
              <div className="pkgs-card-body">
                <div className="pkgs-sk-stack">
                  <span className="pkgs-sk" style={{ height: 18, width: "80%" }} />
                  <span className="pkgs-sk" style={{ height: 13, width: "55%" }} />
                </div>
              </div>
              <div className="pkgs-card-price">
                <span className="pkgs-sk" style={{ height: 22, width: 110 }} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
