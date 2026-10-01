import Link from "next/link";
import type { PackageDetail } from "@arlink28/api-client";
import { priceLabel } from "@/utils/packages";
import { PUBLIC, type PublicType } from "@/utils/publicProducts";

/** The price (when there is one) and the way to enquire. Nothing here is bought online. */
export default function ProductEnquiryCard({ pkg, type }: { pkg: PackageDetail; type: PublicType }) {
  const copy = PUBLIC[type];
  const href = `/contact?${new URLSearchParams({ package: pkg.title, slug: pkg.slug })}`;
  const price = pkg.fromPriceMinor != null ? priceLabel(pkg.fromPriceMinor, pkg.baseCurrency) : null;

  return (
    <>
      <aside className="pkgs-book" aria-label="Enquire" id="price-card">
        <div className="pkgs-book-price">
          <span>{price ? copy.priceFrom : "Price"}</span>
          <strong>{price ?? "On request"}</strong>
          {type === "HotelReservation" && price && <small>per night, for the room as described</small>}
        </div>
        <Link className="pkgs-button pkgs-button-block" href={href}>
          Enquire about this {copy.enquire}
        </Link>
        <p className="pkgs-book-note">
          {type === "VisaSupport"
            ? "Our service fee. The government fee, where there is one, is listed under Details. Nothing is charged online."
            : price
              ? "Final prices depend on your dates and are confirmed by our team. Nothing is charged online."
              : "Tell us what you need and our team sends you a price. Nothing is charged online."}
        </p>
      </aside>

      <div className="pkgs-mobilebar">
        <div>
          <span>{price ? copy.priceFrom : "Price"}</span>
          <strong>{price ?? "On request"}</strong>
        </div>
        <Link className="pkgs-button pkgs-button-solid" href={href}>
          Enquire
        </Link>
      </div>
    </>
  );
}
