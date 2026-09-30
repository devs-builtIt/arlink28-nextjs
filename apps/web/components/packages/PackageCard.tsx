import Link from "next/link";
import type { PackageCard as Card } from "@arlink28/api-client";
import SaveButton from "@/components/packages/SaveButton";
import { categoryLabel, nightsLabel, partyLabel, priceLabel } from "@/utils/packages";
import { isUploaded, testPhotosEnabled, testPhotosFor } from "@/utils/testPhotos";

/** One package in the grid: the photo, what it is and where, and what it costs. */
export default function PackageCard({ pkg, priority = false }: { pkg: Card; priority?: boolean }) {
  const href = `/packages/${pkg.slug}`;
  // An API that predates these fields simply omits them.
  const lodges = pkg.lodges ?? [];
  const highlights = (pkg.highlights ?? []).slice(0, 2);
  // While packages have no real photography (see utils/testPhotos.ts), a stock photo stands in for
  // a missing one, and for a poster.
  const stock = testPhotosEnabled() && !isUploaded(pkg.heroImagePath);
  const photo = stock
    ? testPhotosFor(pkg.slug, pkg.destination.slug, { count: 1, width: 900 })[0].src
    : pkg.heroImagePath;

  return (
    <article className="pkgs-card">
      <div className="pkgs-card-media">
        {photo ? (
          <img src={photo} alt="" loading={priority ? "eager" : "lazy"} decoding="async" width={720} height={576} />
        ) : (
          <span className="pkgs-card-noimage">
            <i className="fa-regular fa-image" aria-hidden="true"></i>
          </span>
        )}
        <SaveButton slug={pkg.slug} title={pkg.title} />
      </div>

      <div className="pkgs-card-body">
        <h3 className="pkgs-card-title">
          <Link className="pkgs-card-link" href={href}>
            {pkg.title}
          </Link>
        </h3>
        <p className="pkgs-card-place">
          {pkg.destination.name}, {pkg.destination.country}
          {lodges.length > 0 && <span className="pkgs-card-lodges">{lodges.join(", ")}</span>}
        </p>
        {pkg.featured && <span className="pkgs-tag">Featured</span>}

        <ul className="pkgs-facts" aria-label="Package facts">
          <li>{nightsLabel(pkg.nights)}</li>
          <li>{partyLabel(pkg.adults, pkg.children)}</li>
          <li>{categoryLabel(pkg.category)}</li>
        </ul>

        {highlights.length > 0 && (
          <ul className="pkgs-highlights" aria-label="Includes">
            {highlights.map((h) => (
              <li key={h}>
                <i className="fa-solid fa-check" aria-hidden="true"></i>
                {h}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="pkgs-card-price">
        <div className="pkgs-price-group">
          {pkg.fromPriceMinor != null ? (
            <>
              <span className="pkgs-price-from">From</span>
              <strong className="pkgs-price">{priceLabel(pkg.fromPriceMinor, pkg.baseCurrency)}</strong>
            </>
          ) : (
            <span className="pkgs-price-note">Price on request</span>
          )}
        </div>
        {/* The card itself is the link (the title's), so this is its visible button, not a second link. */}
        <span className="pkgs-card-cta" aria-hidden="true">
          View package
        </span>
      </div>
    </article>
  );
}
