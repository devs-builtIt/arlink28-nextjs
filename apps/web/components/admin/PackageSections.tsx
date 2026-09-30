"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import type {
  AddOnInput,
  AdminPackageDetail,
  AdminReference,
  FeatureInput,
  RateInput,
  StayInput,
} from "@arlink28/api-client";
import { adminPackagesApi } from "@/utils/api/packages";
import { fromMinor, rangesText, toMinor } from "@/components/admin/format";
import { newKey, SaveBar, useSaver } from "@/components/admin/SectionSave";

// Each section has three parts, so the edit page and the create page share everything but saving:
//   - its row type, with helpers to read rows from a package, compare them and turn them into a request;
//   - a Fields component (the rows, controlled by the page that holds them);
//   - an Editor that holds the rows for an existing package and saves that one section.

type Save = (pkg: AdminPackageDetail) => void;

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="btn btn-quiet btn-s btn-icon" onClick={onClick} aria-label={label}>
      <i className="fa-solid fa-xmark" aria-hidden="true"></i>
    </button>
  );
}

function AddRow({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" className="btn btn-quiet btn-s add-row" onClick={onClick}>
      <i className="fa-solid fa-plus" aria-hidden="true"></i>
      {children}
    </button>
  );
}

// ── Where you stay ────────────────────────────────────────────────────────

export type StayRow = { key: string; propertyId: string; nights: string; roomType: string };

export const stayRowsFrom = (pkg: AdminPackageDetail): StayRow[] =>
  pkg.stays.map((s) => ({ key: s.id, propertyId: s.propertyId, nights: String(s.nights), roomType: s.roomType ?? "" }));

const staySignature = (rows: StayRow[]) =>
  JSON.stringify(rows.filter((r) => !blankStay(r)).map((r) => [r.propertyId, r.nights.trim(), r.roomType.trim()]));

/** A row nobody has filled in is ignored, so a stray "Add" click can never block anything. */
const blankStay = (r: StayRow) => !r.propertyId && !r.roomType.trim();
const stayNightsBad = (r: StayRow) => !(Number.parseInt(r.nights, 10) >= 1);

export const stayProblem = (rows: StayRow[]) =>
  rows.filter((r) => !blankStay(r)).some((r) => !r.propertyId || stayNightsBad(r))
    ? "Choose a property and the nights for every stay."
    : undefined;

export const stayPayload = (rows: StayRow[]): StayInput[] =>
  rows
    .filter((r) => !blankStay(r))
    .map((r) => ({
      propertyId: r.propertyId,
      nights: Number.parseInt(r.nights, 10),
      roomType: r.roomType.trim() || undefined,
    }));

export function StaysFields({
  rows,
  onChange,
  reference,
  nights,
  showErrors,
}: {
  rows: StayRow[];
  onChange: (rows: StayRow[]) => void;
  reference: AdminReference;
  /** The package's nights, for the "placed" tally. */
  nights: number;
  /** Marks the fields that stop the step being passed. */
  showErrors?: boolean;
}) {
  const edit = (key: string, patch: Partial<StayRow>) =>
    onChange(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const placed = rows.filter((r) => !blankStay(r)).reduce((sum, r) => sum + (Number.parseInt(r.nights, 10) || 0), 0);

  return (
    <>
      {rows.length === 0 && <p className="empty rows-empty">No stays yet. Add the lodge or camp guests sleep at.</p>}
      {rows.length > 0 && (
        <div className="rows" role="group" aria-label="Stays">
          <div className="row-head row-stays" aria-hidden="true">
            <span>Property</span>
            <span>Nights</span>
            <span>Room type</span>
            <span></span>
          </div>
          {rows.map((r, i) => (
            <div className="row-line row-stays" key={r.key}>
              <select
                className="input"
                aria-label={`Stay ${i + 1} property`}
                aria-invalid={showErrors && !blankStay(r) && !r.propertyId ? true : undefined}
                value={r.propertyId}
                onChange={(e) => edit(r.key, { propertyId: e.target.value })}
              >
                <option value="" disabled>
                  Choose a property
                </option>
                {reference.properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}, {p.destinationName}
                  </option>
                ))}
              </select>
              <input
                className="input"
                type="number"
                inputMode="numeric"
                min={1}
                max={60}
                aria-label={`Stay ${i + 1} nights`}
                aria-invalid={showErrors && !blankStay(r) && stayNightsBad(r) ? true : undefined}
                value={r.nights}
                onChange={(e) => edit(r.key, { nights: e.target.value })}
              />
              <input
                className="input"
                aria-label={`Stay ${i + 1} room type`}
                placeholder="Garden Suite"
                maxLength={100}
                value={r.roomType}
                onChange={(e) => edit(r.key, { roomType: e.target.value })}
              />
              <RemoveButton
                label={`Remove stay ${i + 1}`}
                onClick={() => onChange(rows.filter((x) => x.key !== r.key))}
              />
            </div>
          ))}
        </div>
      )}

      <AddRow
        onClick={() =>
          // A new stay starts with the nights not yet placed, so the last one is already right.
          onChange([
            ...rows,
            { key: newKey(), propertyId: "", nights: String(Math.max(1, nights - placed)), roomType: "" },
          ])
        }
      >
        Add a stay
      </AddRow>

      {rows.length > 0 && (
        <p className={`field-hint nights-tally${placed !== nights ? " nights-off" : ""}`}>
          {placed} of {nights} {nights === 1 ? "night" : "nights"} placed
          {placed !== nights && ". A package can only be published when they match."}
        </p>
      )}
    </>
  );
}

export function StaysEditor({
  pkg,
  reference,
  onSaved,
}: {
  pkg: AdminPackageDetail;
  reference: AdminReference;
  onSaved: Save;
}) {
  const [rows, setRows] = useState(() => stayRowsFrom(pkg));
  const saver = useSaver();
  const dirty = staySignature(rows) !== staySignature(stayRowsFrom(pkg));

  function submit(e: FormEvent) {
    e.preventDefault();
    saver.run(() => adminPackagesApi.replaceStays(pkg.id, stayPayload(rows)), onSaved);
  }

  return (
    <form onSubmit={submit}>
      <StaysFields
        rows={rows}
        onChange={(next) => {
          saver.clearSaved();
          setRows(next);
        }}
        reference={reference}
        nights={pkg.nights}
      />
      <SaveBar dirty={dirty} {...saver} blocked={stayProblem(rows)} />
    </form>
  );
}

// ── Season rates ──────────────────────────────────────────────────────────

export type RateRow = { key: string; seasonId: string; currency: string; price: string; extra: string };

export const rateRowsFrom = (pkg: AdminPackageDetail): RateRow[] =>
  pkg.rates.map((r) => ({
    key: r.id,
    seasonId: r.seasonId,
    currency: r.currency,
    price: fromMinor(r.priceMinor),
    extra: fromMinor(r.extraNightPriceMinor),
  }));

const rateSignature = (rows: RateRow[]) =>
  JSON.stringify(
    rows
      .filter((r) => !blankRate(r))
      .map((r) => [
        r.seasonId,
        r.currency.trim().toUpperCase(),
        toMinor(r.price) ?? `?${r.price}`,
        r.extra.trim() === "" ? null : (toMinor(r.extra) ?? `?${r.extra}`),
      ]),
  );

const blankRate = (r: RateRow) => !r.seasonId && !r.price.trim() && !r.extra.trim();
const rateCurrencyBad = (r: RateRow) => r.currency.trim().length !== 3;
const ratePriceBad = (r: RateRow) => !toMinor(r.price);
const rateExtraBad = (r: RateRow) => r.extra.trim() !== "" && toMinor(r.extra) === null;

export const rateProblem = (rows: RateRow[]) =>
  rows.filter((r) => !blankRate(r)).some((r) => !r.seasonId || rateCurrencyBad(r) || ratePriceBad(r) || rateExtraBad(r))
    ? "Every rate needs a season, a three-letter currency and a price."
    : undefined;

export const ratePayload = (rows: RateRow[]): RateInput[] =>
  rows
    .filter((r) => !blankRate(r))
    .map((r) => ({
      seasonId: r.seasonId,
      currency: r.currency.trim().toUpperCase(),
      priceMinor: toMinor(r.price)!,
      extraNightPriceMinor: r.extra.trim() === "" ? undefined : toMinor(r.extra)!,
    }));

export function RatesFields({
  rows,
  onChange,
  reference,
  baseCurrency,
  pricingBasis,
  showErrors,
}: {
  rows: RateRow[];
  onChange: (rows: RateRow[]) => void;
  reference: AdminReference;
  baseCurrency: string;
  pricingBasis: string;
  showErrors?: boolean;
}) {
  const bad = (r: RateRow, test: boolean) => (showErrors && !blankRate(r) && test ? true : undefined);
  const edit = (key: string, patch: Partial<RateRow>) =>
    onChange(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  return (
    <>
      {rows.length === 0 && <p className="empty rows-empty">No rates yet. Without one, this package has no price.</p>}
      {rows.length > 0 && (
        <div className="rows" role="group" aria-label="Season rates">
          <div className="row-head row-rates" aria-hidden="true">
            <span>Season</span>
            <span>Currency</span>
            <span>{pricingBasis === "PerPerson" ? "Price per person" : "Package price"}</span>
            <span>Extra night</span>
            <span></span>
          </div>
          {rows.map((r, i) => (
            <div className="row-line row-rates" key={r.key}>
              <select
                className="input"
                aria-label={`Rate ${i + 1} season`}
                aria-invalid={bad(r, !r.seasonId)}
                value={r.seasonId}
                onChange={(e) => edit(r.key, { seasonId: e.target.value })}
              >
                <option value="" disabled>
                  Choose a season
                </option>
                {reference.seasons.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({rangesText(s.ranges)})
                  </option>
                ))}
              </select>
              <input
                className="input"
                aria-label={`Rate ${i + 1} currency`}
                aria-invalid={bad(r, rateCurrencyBad(r))}
                maxLength={3}
                value={r.currency}
                onChange={(e) => edit(r.key, { currency: e.target.value.toUpperCase() })}
              />
              <input
                className="input"
                inputMode="decimal"
                aria-label={`Rate ${i + 1} package price`}
                aria-invalid={bad(r, ratePriceBad(r))}
                placeholder="8,488"
                value={r.price}
                onChange={(e) => edit(r.key, { price: e.target.value })}
              />
              <input
                className="input"
                inputMode="decimal"
                aria-label={`Rate ${i + 1} extra night price`}
                aria-invalid={bad(r, rateExtraBad(r))}
                placeholder="Not sold"
                value={r.extra}
                onChange={(e) => edit(r.key, { extra: e.target.value })}
              />
              <RemoveButton
                label={`Remove rate ${i + 1}`}
                onClick={() => onChange(rows.filter((x) => x.key !== r.key))}
              />
            </div>
          ))}
        </div>
      )}

      <AddRow
        onClick={() =>
          onChange([...rows, { key: newKey(), seasonId: "", currency: baseCurrency, price: "", extra: "" }])
        }
      >
        Add a rate
      </AddRow>
    </>
  );
}

export function RatesEditor({
  pkg,
  reference,
  onSaved,
}: {
  pkg: AdminPackageDetail;
  reference: AdminReference;
  onSaved: Save;
}) {
  const [rows, setRows] = useState(() => rateRowsFrom(pkg));
  const saver = useSaver();
  const dirty = rateSignature(rows) !== rateSignature(rateRowsFrom(pkg));

  function submit(e: FormEvent) {
    e.preventDefault();
    saver.run(() => adminPackagesApi.replaceRates(pkg.id, ratePayload(rows)), onSaved);
  }

  return (
    <form onSubmit={submit}>
      <RatesFields
        rows={rows}
        onChange={(next) => {
          saver.clearSaved();
          setRows(next);
        }}
        reference={reference}
        baseCurrency={pkg.baseCurrency}
        pricingBasis={pkg.pricingBasis}
      />
      <SaveBar dirty={dirty} {...saver} blocked={rateProblem(rows)} />
    </form>
  );
}

// ── What's included ───────────────────────────────────────────────────────

const FEATURE_SECTIONS: [string, string][] = [
  ["Included", "Included"],
  ["PremiumService", "ARLink28 premium services"],
  ["Highlight", "Highlights"],
  ["Vehicle", "Vehicle"],
  ["Perk", "Perks"],
  ["Excluded", "Not included"],
  ["Note", "Notes"],
];
const sectionOrder = (s: string) => FEATURE_SECTIONS.findIndex(([v]) => v === s);

export type FeatureRow = { key: string; section: string; featureId: string; label: string; footnote: string };

/** Grouped by section, in the order the site shows them. */
export const featureRowsFrom = (pkg: AdminPackageDetail): FeatureRow[] =>
  [...pkg.features]
    .sort((a, b) => sectionOrder(a.section) - sectionOrder(b.section) || a.sortOrder - b.sortOrder)
    .map((f) => ({
      key: f.id,
      section: f.section,
      featureId: f.featureId ?? "",
      label: f.featureId ? "" : f.label,
      footnote: f.footnote ?? "",
    }));

const featureSignature = (rows: FeatureRow[]) =>
  JSON.stringify(
    rows
      .filter((r) => !blankFeature(r))
      .map((r) => [r.section, r.featureId, r.featureId ? "" : r.label.trim(), r.footnote.trim()]),
  );

const blankFeature = (r: FeatureRow) => !r.featureId && !r.label.trim() && !r.footnote.trim();
const featureTextBad = (r: FeatureRow) => !r.featureId && r.label.trim() === "";

export const featureProblem = (rows: FeatureRow[]) =>
  rows.filter((r) => !blankFeature(r)).some(featureTextBad)
    ? "Every line needs some text, or a choice from the list."
    : undefined;

export const featurePayload = (rows: FeatureRow[]): FeatureInput[] =>
  rows
    .filter((r) => !blankFeature(r))
    .map((r) => ({
      section: r.section as FeatureInput["section"],
      featureId: r.featureId || undefined,
      label: r.featureId ? undefined : r.label.trim(),
      footnote: r.footnote.trim() || undefined,
    }));

export function FeaturesFields({
  rows,
  onChange,
  reference,
  showErrors,
}: {
  rows: FeatureRow[];
  onChange: (rows: FeatureRow[]) => void;
  reference: AdminReference;
  showErrors?: boolean;
}) {
  const edit = (key: string, patch: Partial<FeatureRow>) =>
    onChange(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  function add(section: string) {
    const row = { key: newKey(), section, featureId: "", label: "", footnote: "" };
    const at = rows.map((r) => r.section).lastIndexOf(section);
    if (at !== -1) return onChange([...rows.slice(0, at + 1), row, ...rows.slice(at + 1)]);
    // A section with no lines yet goes where the site would show it.
    const before = rows.findIndex((r) => sectionOrder(r.section) > sectionOrder(section));
    onChange(before === -1 ? [...rows, row] : [...rows.slice(0, before), row, ...rows.slice(before)]);
  }

  return (
    <>
      {FEATURE_SECTIONS.map(([section, heading]) => {
        const lines = rows.filter((r) => r.section === section);
        return (
          <div className="feature-group" key={section} role="group" aria-label={heading}>
            <h3 className="incl-title">{heading}</h3>
            {lines.map((r, i) => (
              <div className="row-line row-features" key={r.key}>
                <div className="feature-pick">
                  <select
                    className="input"
                    aria-label={`${heading} line ${i + 1}`}
                    value={r.featureId}
                    onChange={(e) => edit(r.key, { featureId: e.target.value })}
                  >
                    <option value="">Write my own</option>
                    {reference.features.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                  {!r.featureId && (
                    <input
                      className="input"
                      aria-label={`${heading} line ${i + 1} text`}
                      aria-invalid={showErrors && !blankFeature(r) && featureTextBad(r) ? true : undefined}
                      placeholder="What's included"
                      maxLength={200}
                      value={r.label}
                      onChange={(e) => edit(r.key, { label: e.target.value })}
                    />
                  )}
                </div>
                <input
                  className="input"
                  aria-label={`${heading} line ${i + 1} footnote`}
                  placeholder="Footnote (optional)"
                  maxLength={300}
                  value={r.footnote}
                  onChange={(e) => edit(r.key, { footnote: e.target.value })}
                />
                <RemoveButton
                  label={`Remove ${heading} line ${i + 1}`}
                  onClick={() => onChange(rows.filter((x) => x.key !== r.key))}
                />
              </div>
            ))}
            <AddRow onClick={() => add(section)}>Add to {heading}</AddRow>
          </div>
        );
      })}
    </>
  );
}

export function FeaturesEditor({
  pkg,
  reference,
  onSaved,
}: {
  pkg: AdminPackageDetail;
  reference: AdminReference;
  onSaved: Save;
}) {
  const [rows, setRows] = useState(() => featureRowsFrom(pkg));
  const saver = useSaver();
  const dirty = featureSignature(rows) !== featureSignature(featureRowsFrom(pkg));

  function submit(e: FormEvent) {
    e.preventDefault();
    saver.run(() => adminPackagesApi.replaceFeatures(pkg.id, featurePayload(rows)), onSaved);
  }

  return (
    <form onSubmit={submit}>
      <FeaturesFields
        rows={rows}
        onChange={(next) => {
          saver.clearSaved();
          setRows(next);
        }}
        reference={reference}
      />
      <SaveBar dirty={dirty} {...saver} blocked={featureProblem(rows)} />
    </form>
  );
}

// ── Add-ons ───────────────────────────────────────────────────────────────

const UNITS: [string, string][] = [
  ["PerStay", "Per stay"],
  ["PerNight", "Per night"],
  ["PerDay", "Per day"],
  ["PerPerson", "Per person"],
];

export type AddOnRow = {
  key: string;
  id?: string;
  name: string;
  description: string;
  unit: string;
  currency: string;
  price: string;
};

export const addOnRowsFrom = (pkg: AdminPackageDetail): AddOnRow[] =>
  pkg.addOns.map((a) => ({
    key: a.id,
    id: a.id,
    name: a.name,
    description: a.description ?? "",
    unit: a.unit,
    currency: a.currency,
    price: fromMinor(a.priceMinor),
  }));

const addOnSignature = (rows: AddOnRow[]) =>
  JSON.stringify(
    rows
      .filter((r) => !blankAddOn(r))
      .map((r) => [
        r.id ?? "",
        r.name.trim(),
        r.description.trim(),
        r.unit,
        r.currency.trim().toUpperCase(),
        toMinor(r.price) ?? `?${r.price}`,
      ]),
  );

const blankAddOn = (r: AddOnRow) => !r.id && !r.name.trim() && !r.description.trim() && !r.price.trim();
const addOnNameBad = (r: AddOnRow) => r.name.trim() === "";
const addOnCurrencyBad = (r: AddOnRow) => r.currency.trim().length !== 3;
const addOnPriceBad = (r: AddOnRow) => toMinor(r.price) === null;

export const addOnProblem = (rows: AddOnRow[]) =>
  rows.filter((r) => !blankAddOn(r)).some((r) => addOnNameBad(r) || addOnCurrencyBad(r) || addOnPriceBad(r))
    ? "Every add-on needs a name, a three-letter currency and a price."
    : undefined;

export const addOnPayload = (rows: AddOnRow[]): AddOnInput[] =>
  rows
    .filter((r) => !blankAddOn(r))
    .map((r) => ({
      id: r.id,
      name: r.name.trim(),
      description: r.description.trim() || undefined,
      unit: r.unit as AddOnInput["unit"],
      currency: r.currency.trim().toUpperCase(),
      priceMinor: toMinor(r.price)!,
    }));

export function AddOnsFields({
  rows,
  onChange,
  baseCurrency,
  showErrors,
}: {
  rows: AddOnRow[];
  onChange: (rows: AddOnRow[]) => void;
  baseCurrency: string;
  showErrors?: boolean;
}) {
  const bad = (r: AddOnRow, test: boolean) => (showErrors && !blankAddOn(r) && test ? true : undefined);
  const edit = (key: string, patch: Partial<AddOnRow>) =>
    onChange(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  return (
    <>
      {rows.length === 0 && <p className="empty rows-empty">No add-ons. Guests can still book the package.</p>}
      {rows.length > 0 && (
        <div className="rows" role="group" aria-label="Add-ons">
          <div className="row-head row-addons" aria-hidden="true">
            <span>Name</span>
            <span>Charged</span>
            <span>Currency</span>
            <span>Price</span>
            <span></span>
          </div>
          {rows.map((r, i) => (
            <div className="row-line row-addons" key={r.key}>
              <div className="addon-main">
                <input
                  className="input"
                  aria-label={`Add-on ${i + 1} name`}
                  aria-invalid={bad(r, addOnNameBad(r))}
                  placeholder="Private exclusive vehicle"
                  maxLength={150}
                  value={r.name}
                  onChange={(e) => edit(r.key, { name: e.target.value })}
                />
                <input
                  className="input"
                  aria-label={`Add-on ${i + 1} description`}
                  placeholder="Description (optional)"
                  maxLength={500}
                  value={r.description}
                  onChange={(e) => edit(r.key, { description: e.target.value })}
                />
              </div>
              <select
                className="input"
                aria-label={`Add-on ${i + 1} charged`}
                value={r.unit}
                onChange={(e) => edit(r.key, { unit: e.target.value })}
              >
                {UNITS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <input
                className="input"
                aria-label={`Add-on ${i + 1} currency`}
                aria-invalid={bad(r, addOnCurrencyBad(r))}
                maxLength={3}
                value={r.currency}
                onChange={(e) => edit(r.key, { currency: e.target.value.toUpperCase() })}
              />
              <input
                className="input"
                inputMode="decimal"
                aria-label={`Add-on ${i + 1} price`}
                aria-invalid={bad(r, addOnPriceBad(r))}
                placeholder="490"
                value={r.price}
                onChange={(e) => edit(r.key, { price: e.target.value })}
              />
              <RemoveButton
                label={`Remove add-on ${i + 1}`}
                onClick={() => onChange(rows.filter((x) => x.key !== r.key))}
              />
            </div>
          ))}
        </div>
      )}

      <AddRow
        onClick={() =>
          onChange([
            ...rows,
            { key: newKey(), name: "", description: "", unit: "PerStay", currency: baseCurrency, price: "" },
          ])
        }
      >
        Add an add-on
      </AddRow>
    </>
  );
}

export function AddOnsEditor({ pkg, onSaved }: { pkg: AdminPackageDetail; onSaved: Save }) {
  const [rows, setRows] = useState(() => addOnRowsFrom(pkg));
  const saver = useSaver();
  const dirty = addOnSignature(rows) !== addOnSignature(addOnRowsFrom(pkg));

  function submit(e: FormEvent) {
    e.preventDefault();
    saver.run(
      () => adminPackagesApi.replaceAddOns(pkg.id, addOnPayload(rows)),
      (updated) => {
        onSaved(updated);
        setRows(addOnRowsFrom(updated)); // new add-ons now have ids, and keep them from here on
      },
    );
  }

  return (
    <form onSubmit={submit}>
      <AddOnsFields
        rows={rows}
        onChange={(next) => {
          saver.clearSaved();
          setRows(next);
        }}
        baseCurrency={pkg.baseCurrency}
      />
      <SaveBar dirty={dirty} {...saver} blocked={addOnProblem(rows)} />
    </form>
  );
}
