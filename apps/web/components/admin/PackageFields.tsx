import type { ChangeEvent } from "react";
import type { DestinationResponse } from "@arlink28/api-client";

export type PackageFormValues = {
  title: string;
  destinationId: string;
  category: string;
  nights: number;
  adults: number;
  children: number;
  subtitle: string;
  summary: string;
  // Only on the edit page.
  minNights: number;
  pricingBasis: string;
  baseCurrency: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  featured: boolean;
};

/** What most packages are, so a new one starts one field away from done. */
export const NEW_PACKAGE: PackageFormValues = {
  title: "",
  destinationId: "",
  category: "SAFARI",
  nights: 2,
  adults: 2,
  children: 0,
  subtitle: "",
  summary: "",
  minNights: 2,
  pricingBasis: "PerParty",
  baseCurrency: "USD",
  description: "",
  seoTitle: "",
  seoDescription: "",
  featured: false,
};

const CATEGORIES: [string, string][] = [
  ["SAFARI", "Safari"],
  ["LODGE", "Lodge stay"],
];

type Props = {
  values: PackageFormValues;
  onChange: (next: PackageFormValues) => void;
  destinations: DestinationResponse[];
  /** Per-field messages from a 400 response, keyed by the API's field name. */
  fieldErrors?: Record<string, string[]>;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Adds pricing basis, minimum stay, currency, description, search listing and featured. */
  extended?: boolean;
  /**
   * Which fields to show. "core": name, destination, type, party, tagline, summary. "pricing": minimum
   * stay, pricing basis and currency. "listing": description, search listing and featured.
   * "basics" is core and listing together (the create stepper). Leave out for the core fields.
   */
  part?: "core" | "pricing" | "listing" | "basics";
};

/** ASP.NET reports validation errors under the property name, capitalised. */
function FieldError({ name, errors }: { name: string; errors?: Record<string, string[]> }) {
  const message = errors?.[name]?.[0] ?? errors?.[name.charAt(0).toUpperCase() + name.slice(1)]?.[0];
  return message ? <span className="field-error">{message}</span> : null;
}

/** The package fields shared by "New package" and the edit page. */
export default function PackageFields({
  values,
  onChange,
  destinations,
  fieldErrors,
  disabled,
  autoFocus,
  extended,
  part,
}: Props) {
  const set = <K extends keyof PackageFormValues>(key: K, value: PackageFormValues[K]) =>
    onChange({ ...values, [key]: value });
  const number = (key: "nights" | "minNights" | "adults" | "children") => (e: ChangeEvent<HTMLInputElement>) =>
    set(key, e.target.value === "" ? 0 : Number(e.target.value));

  return (
    <>
      {part !== "pricing" && part !== "listing" && (
        <>
          <div className="field">
            <label htmlFor="pkg-title">Package name</label>
            <input
              id="pkg-title"
              className="input"
              value={values.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Giraffe Manor Luxury Escape"
              maxLength={200}
              required
              autoFocus={autoFocus}
              disabled={disabled}
            />
            <FieldError name="title" errors={fieldErrors} />
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="pkg-destination">Destination</label>
              <select
                id="pkg-destination"
                className="input"
                value={values.destinationId}
                onChange={(e) => set("destinationId", e.target.value)}
                required
                disabled={disabled}
              >
                <option value="" disabled>
                  Choose a destination
                </option>
                {destinations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}, {d.country}
                  </option>
                ))}
              </select>
              <FieldError name="destinationId" errors={fieldErrors} />
            </div>
            <div className="field">
              <label htmlFor="pkg-category">Type</label>
              <select
                id="pkg-category"
                className="input"
                value={values.category}
                onChange={(e) => set("category", e.target.value)}
                disabled={disabled}
              >
                {CATEGORIES.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field-row field-row-3">
            <div className="field">
              <label htmlFor="pkg-nights">Nights</label>
              <input
                id="pkg-nights"
                className="input"
                type="number"
                inputMode="numeric"
                min={1}
                max={60}
                value={values.nights || ""}
                onChange={number("nights")}
                required
                disabled={disabled}
              />
              <FieldError name="nights" errors={fieldErrors} />
            </div>
            <div className="field">
              <label htmlFor="pkg-adults">Adults</label>
              <input
                id="pkg-adults"
                className="input"
                type="number"
                inputMode="numeric"
                min={1}
                max={20}
                value={values.adults || ""}
                onChange={number("adults")}
                required
                disabled={disabled}
              />
              <FieldError name="adults" errors={fieldErrors} />
            </div>
            <div className="field">
              <label htmlFor="pkg-children">Children</label>
              <input
                id="pkg-children"
                className="input"
                type="number"
                inputMode="numeric"
                min={0}
                max={20}
                value={values.children}
                onChange={number("children")}
                disabled={disabled}
              />
              <FieldError name="children" errors={fieldErrors} />
            </div>
          </div>

          <div className="field">
            <label htmlFor="pkg-subtitle">
              Tagline <span className="optional">optional</span>
            </label>
            <input
              id="pkg-subtitle"
              className="input"
              value={values.subtitle}
              onChange={(e) => set("subtitle", e.target.value)}
              maxLength={300}
              disabled={disabled}
            />
            <FieldError name="subtitle" errors={fieldErrors} />
          </div>

          <div className="field">
            <label htmlFor="pkg-summary">
              Summary <span className="optional">optional</span>
            </label>
            <textarea
              id="pkg-summary"
              className="input textarea"
              rows={4}
              value={values.summary}
              onChange={(e) => set("summary", e.target.value)}
              maxLength={1000}
              disabled={disabled}
            />
            <span className="field-hint">Shown on the package card and at the top of the package page.</span>
            <FieldError name="summary" errors={fieldErrors} />
          </div>
        </>
      )}
      {(extended || part === "pricing") && (
        <>
          <div className="field-row field-row-3">
            <div className="field">
              <label htmlFor="pkg-min-nights">Minimum stay</label>
              <input
                id="pkg-min-nights"
                className="input"
                type="number"
                inputMode="numeric"
                min={1}
                max={values.nights}
                value={values.minNights || ""}
                onChange={number("minNights")}
                required
                disabled={disabled}
              />
              <span className="field-hint">Guests can book fewer nights than the package, down to this.</span>
              <FieldError name="minNights" errors={fieldErrors} />
            </div>
            <div className="field">
              <label htmlFor="pkg-basis">Priced</label>
              <select
                id="pkg-basis"
                className="input"
                value={values.pricingBasis}
                onChange={(e) => set("pricingBasis", e.target.value)}
                disabled={disabled}
              >
                <option value="PerParty">Per party</option>
                <option value="PerPerson">Per person</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="pkg-currency">Main currency</label>
              <input
                id="pkg-currency"
                className="input"
                value={values.baseCurrency}
                onChange={(e) => set("baseCurrency", e.target.value.toUpperCase())}
                maxLength={3}
                required
                disabled={disabled}
              />
              <span className="field-hint">The from-price uses rates in this currency.</span>
              <FieldError name="baseCurrency" errors={fieldErrors} />
            </div>
          </div>
        </>
      )}
      {(extended || part === "basics" || part === "listing") && (
        <>
          <div className="field">
            <label htmlFor="pkg-description">
              Full description <span className="optional">optional</span>
            </label>
            <textarea
              id="pkg-description"
              className="input textarea"
              rows={6}
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              maxLength={10000}
              disabled={disabled}
            />
            <FieldError name="description" errors={fieldErrors} />
          </div>

          <fieldset className="field">
            <legend>How it appears in search results</legend>
            <div className="field">
              <label htmlFor="pkg-seo-title">
                Page title <span className="optional">optional, about 60 characters</span>
              </label>
              <input
                id="pkg-seo-title"
                className="input"
                value={values.seoTitle}
                onChange={(e) => set("seoTitle", e.target.value)}
                maxLength={70}
                disabled={disabled}
              />
              <FieldError name="seoTitle" errors={fieldErrors} />
            </div>
            <div className="field">
              <label htmlFor="pkg-seo-description">
                Description <span className="optional">optional, about 155 characters</span>
              </label>
              <textarea
                id="pkg-seo-description"
                className="input textarea"
                rows={2}
                value={values.seoDescription}
                onChange={(e) => set("seoDescription", e.target.value)}
                maxLength={300}
                disabled={disabled}
              />
              <FieldError name="seoDescription" errors={fieldErrors} />
            </div>
          </fieldset>

          <label className="addon-pick">
            <input
              type="checkbox"
              checked={values.featured}
              onChange={(e) => set("featured", e.target.checked)}
              disabled={disabled}
            />
            <span>
              Feature this package
              <small>Featured packages come first in the list on the site.</small>
            </span>
          </label>
        </>
      )}
    </>
  );
}
