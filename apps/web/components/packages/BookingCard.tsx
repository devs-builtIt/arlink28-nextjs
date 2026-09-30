"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { PackageAddOn, Quote } from "@arlink28/api-client";
import { packagesApi } from "@/utils/api/packages";
import { ApiError } from "@/utils/api/client";
import { nightsLabel, partyLabel, priceLabel, rangeLabel, unitLabel } from "@/utils/packages";

type Props = {
  slug: string;
  title: string;
  nights: number;
  adults: number;
  children: number;
  currency: string;
  pricingBasis: string;
  fromPriceMinor: number | null;
  addOns: PackageAddOn[];
  /** Whether nights beyond the package's own can be bought. */
  extraNightsSold: boolean;
  /** Every date range a rate covers, so guests see which check-in dates work. */
  coverage: { start: string; end: string }[];
};

const isoToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** The first check-in date a rate covers from tomorrow on, so the card opens with a price. */
function firstOpenDate(coverage: { start: string; end: string }[]): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const tomorrow = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const open = coverage
    .filter((r) => r.end >= tomorrow)
    .sort((a, b) => a.start.localeCompare(b.start))
    .at(0);
  return open ? (open.start > tomorrow ? open.start : tomorrow) : tomorrow;
}

/**
 * The price for the guest's dates, from the same rules the admin uses. It opens on the first date
 * that has a price, and follows every change (date, extra nights, add-ons) as it happens.
 */
export default function BookingCard({
  slug,
  title,
  nights: packageNights,
  adults,
  children,
  currency,
  pricingBasis,
  fromPriceMinor,
  addOns,
  extraNightsSold,
  coverage,
}: Props) {
  const [checkIn, setCheckIn] = useState("");
  const [nights, setNights] = useState(packageNights);
  const [picked, setPicked] = useState<Record<string, number>>({});
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const latest = useRef(0);

  // Chosen here, not on the server, so the date is the guest's own today.
  useEffect(() => setCheckIn(firstOpenDate(coverage)), [coverage]);

  useEffect(() => {
    if (!checkIn) return;
    const request = ++latest.current;
    setLoading(true);
    const timer = setTimeout(() => {
      packagesApi
        .quote(slug, { checkIn, nights, addOns: picked })
        .then((result) => {
          if (request !== latest.current) return;
          setQuote(result);
          setError(null);
        })
        .catch((err) => {
          if (request !== latest.current) return;
          setQuote(null);
          setError({
            message: err instanceof Error ? err.message : "The price couldn't be worked out.",
            code: err instanceof ApiError ? err.code : undefined,
          });
        })
        .finally(() => request === latest.current && setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [slug, checkIn, nights, picked]);

  const open = coverage.filter((r) => r.end >= isoToday());
  const basis = pricingBasis === "PerPerson" ? "per person" : "per party";
  const total = quote ? priceLabel(quote.totalMinor, quote.currency) : null;
  const enquiry = new URLSearchParams({ package: title, slug });
  if (quote) {
    enquiry.set("checkIn", checkIn);
    enquiry.set("nights", String(nights));
  }
  const enquiryHref = `/contact?${enquiry}`;

  return (
    <>
      <aside className="pkgs-book" aria-label="Get a price" id="price-card">
        <div className="pkgs-book-price" aria-live="polite">
          <span>{quote ? "Total" : "From"}</span>
          {total ? (
            <strong>{total}</strong>
          ) : fromPriceMinor != null ? (
            <strong>{priceLabel(fromPriceMinor, currency)}</strong>
          ) : (
            <strong>On request</strong>
          )}
          <small>
            {partyLabel(adults, children)}, {nightsLabel(nights)}
          </small>
          {loading && <span className="pkgs-spinner" role="status" aria-label="Updating the price"></span>}
        </div>

        <div className="pkgs-book-fields">
          <label>
            <span>Check-in</span>
            <input type="date" value={checkIn} min={isoToday()} onChange={(e) => setCheckIn(e.target.value)} required />
          </label>
          {extraNightsSold && (
            <label>
              <span>Nights</span>
              <select value={nights} onChange={(e) => setNights(Number(e.target.value))}>
                {Array.from({ length: 8 }, (_, i) => packageNights + i).map((n) => (
                  <option key={n} value={n}>
                    {nightsLabel(n)}
                    {n === packageNights ? " (as packaged)" : ""}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {open.length > 0 && (
          <p className="pkgs-book-coverage">
            Check-in dates with a price: {open.map((r) => rangeLabel(r.start, r.end)).join("; ")}.
          </p>
        )}

        {addOns.length > 0 && (
          <fieldset className="pkgs-book-addons">
            <legend>Add to your stay</legend>
            {addOns.map((a) => (
              <label key={a.id}>
                <input
                  type="checkbox"
                  checked={(picked[a.id] ?? 0) > 0}
                  onChange={(e) => setPicked((prev) => ({ ...prev, [a.id]: e.target.checked ? 1 : 0 }))}
                />
                <span>
                  {a.name}
                  <small>
                    {priceLabel(a.priceMinor, a.currency)} {unitLabel(a.unit)}
                  </small>
                </span>
              </label>
            ))}
          </fieldset>
        )}

        {error && (
          <p className="pkgs-book-error" role="alert">
            {error.message}
            {error.code === "NO_RATE_FOR_DATE" && open.length > 0 && " Choose a check-in date from the list above."}
          </p>
        )}

        {quote && (
          <details className="pkgs-book-lines">
            <summary>See how the total is made up</summary>
            <ul>
              {quote.lines.map((l, i) => (
                <li key={i}>
                  <span>{l.label}</span>
                  <span>{priceLabel(l.amountMinor, l.currency)}</span>
                </li>
              ))}
            </ul>
          </details>
        )}

        <Link className="pkgs-button pkgs-button-block" href={enquiryHref}>
          Enquire about this package
        </Link>
        <p className="pkgs-book-note">
          Priced {basis} in {currency}. Nothing is charged online. Our team confirms the details with you.
        </p>
      </aside>

      <div className="pkgs-mobilebar">
        <div>
          <span>{quote ? "Total" : "From"}</span>
          <strong>{total ?? (fromPriceMinor != null ? priceLabel(fromPriceMinor, currency) : "On request")}</strong>
        </div>
        <a className="pkgs-button" href="#price-card">
          Get a price
        </a>
        <Link className="pkgs-button pkgs-button-solid" href={enquiryHref}>
          Enquire
        </Link>
      </div>
    </>
  );
}
