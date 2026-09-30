import Link from "next/link";
import type { PackageCard as Card } from "@arlink28/api-client";
import SaveButton from "@/components/packages/SaveButton";
import { priceLabel } from "@/utils/packages";
import { PUBLIC, cardFacts, headline, publicPath, type PublicType } from "@/utils/publicProducts";

/** One flight, hotel or visa in a listing: the photo if there is one, what it is, and what it costs. */
export default function ProductCard({
  pkg,
  type,
  priority = false,
}: {
  pkg: Card;
  type: PublicType;
  priority?: boolean;
}) {
  const copy = PUBLIC[type];
  const line = headline(type, pkg.details);
  const facts = cardFacts(type, pkg.details);

  return (
    <article className="pkgs-card">
      <div className="pkgs-card-media">
        {pkg.heroImagePath ? (
          <img
            src={pkg.heroImagePath}
            alt=""
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            width={720}
            height={576}
          />
        ) : (
          <span className="pkgs-card-noimage">
            <i className="fa-regular fa-image" aria-hidden="true"></i>
          </span>
        )}
        <SaveButton slug={pkg.slug} title={pkg.title} />
      </div>

      <div className="pkgs-card-body">
        <h3 className="pkgs-card-title">
          <Link className="pkgs-card-link" href={publicPath(type, pkg.slug)}>
            {pkg.title}
          </Link>
        </h3>
        <p className="pkgs-card-place">
          {pkg.destination.name}, {pkg.destination.country}
          {line && line !== pkg.title && <span className="pkgs-card-lodges">{line}</span>}
        </p>
        {pkg.featured && <span className="pkgs-tag">Featured</span>}

        {facts.length > 0 && (
          <ul className="pkgs-facts" aria-label={`${copy.title} facts`}>
            {facts.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="pkgs-card-price">
        <div className="pkgs-price-group">
          {pkg.fromPriceMinor != null ? (
            <>
              <span className="pkgs-price-from">{copy.priceFrom}</span>
              <strong className="pkgs-price">{priceLabel(pkg.fromPriceMinor, pkg.baseCurrency)}</strong>
            </>
          ) : (
            <span className="pkgs-price-note">Enquire for a price</span>
          )}
        </div>
        <span className="pkgs-card-cta" aria-hidden="true">
          {copy.cta}
        </span>
      </div>
    </article>
  );
}
