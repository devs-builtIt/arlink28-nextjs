"use client";

import { Suspense, useEffect, useState, type FormEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import type {
  AdminPackageDetail,
  AdminReference,
  DestinationResponse,
  PackageDetail,
  PackageMedia,
  Quote,
} from "@arlink28/api-client";
import ProtectedPage from "@/components/ProtectedPage";
import Notice from "@/components/admin/Notice";
import PackageFields, { type PackageFormValues } from "@/components/admin/PackageFields";
import PhotoManager from "@/components/admin/PhotoManager";
import PublishPanel from "@/components/admin/PublishPanel";
import { AddOnsEditor, FeaturesEditor, RatesEditor, StaysEditor } from "@/components/admin/PackageSections";
import { SaveBar, useSaver } from "@/components/admin/SectionSave";
import { Crumbs, Panel, Skeleton, Spinner, StatusBadge } from "@/components/admin/ui";
import { adminPackagesApi, packagesApi } from "@/utils/api/packages";
import { ApiError } from "@/utils/api/client";
import { fromMinor, fullDate, isoDateFromToday, money, party, timeAgo, unitLabel } from "@/components/admin/format";
import {
  detailsFromApi,
  detailsProblem,
  detailsSummary,
  detailsToPayload,
  fromPriceMinor,
  isHoliday,
  typeLabel,
  type OtherType,
} from "@/utils/productTypes";

function QuoteChecker({ pkg }: { pkg: PackageDetail }) {
  const [checkIn, setCheckIn] = useState(isoDateFromToday(14));
  const [nights, setNights] = useState(pkg.nights);
  const [addOns, setAddOns] = useState<Record<string, number>>({});
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setQuote(null);
    setLoading(true);
    try {
      setQuote(await packagesApi.quote(pkg.slug, { checkIn, nights, addOns }));
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : "The quote couldn't be calculated.",
        code: err instanceof ApiError ? err.code : undefined,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card quote" aria-labelledby="quote-title">
      <h2 className="card-title" id="quote-title">
        Check a price
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="check-in">Check-in</label>
          <input
            id="check-in"
            className="input"
            type="date"
            min={isoDateFromToday(0)}
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="nights">Nights</label>
          <input
            id="nights"
            className="input"
            type="number"
            min={pkg.minNights}
            value={nights}
            onChange={(e) => setNights(Number(e.target.value))}
            required
          />
          <span className="field-hint">
            Priced for {pkg.nights} {pkg.nights === 1 ? "night" : "nights"}
            {pkg.rates.some((r) => r.extraNightPriceMinor != null) ? "; extra nights are sold." : "."}
          </span>
        </div>
        {pkg.addOns.length > 0 && (
          <fieldset className="field">
            <legend>Add-ons</legend>
            {pkg.addOns.map((a) => (
              <label className="addon-pick" key={a.id}>
                <input
                  type="checkbox"
                  checked={(addOns[a.id] ?? 0) > 0}
                  onChange={(e) => setAddOns((prev) => ({ ...prev, [a.id]: e.target.checked ? 1 : 0 }))}
                />
                <span>
                  {a.name}
                  <small>
                    {money(a.priceMinor, a.currency)} {unitLabel(a.unit)}
                  </small>
                </span>
              </label>
            ))}
          </fieldset>
        )}
        <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
          {loading && <Spinner />}
          {loading ? "Calculating" : "Get price"}
        </button>
      </form>

      {error && (
        <div className="quote-result">
          <Notice tone="error">
            {error.message}
            {error.code === "NO_RATE_FOR_DATE" && " Try a date inside one of the seasons listed on this page."}
          </Notice>
        </div>
      )}

      {quote && (
        <div className="quote-result" role="status" aria-label="Price">
          <ul className="quote-lines">
            {quote.lines.map((l, i) => (
              <li key={i}>
                <span>{l.label}</span>
                <span>{money(l.amountMinor, l.currency)}</span>
              </li>
            ))}
          </ul>
          <p className="quote-total">
            <span>
              Total for {quote.nights} {quote.nights === 1 ? "night" : "nights"}
            </span>
            <strong>{money(quote.totalMinor, quote.currency)}</strong>
          </p>
        </div>
      )}
    </section>
  );
}

function toValues(pkg: AdminPackageDetail): PackageFormValues {
  return {
    productType: pkg.productType as PackageFormValues["productType"],
    fromPrice: fromMinor(pkg.fromPriceMinor),
    details: isHoliday(pkg.productType) ? {} : detailsFromApi(pkg.productType as OtherType, pkg.details),
    title: pkg.title,
    destinationId: pkg.destination.id,
    category: pkg.category,
    nights: pkg.nights,
    adults: pkg.adults,
    children: pkg.children,
    subtitle: pkg.subtitle ?? "",
    summary: pkg.summary ?? "",
    minNights: pkg.minNights,
    pricingBasis: pkg.pricingBasis,
    baseCurrency: pkg.baseCurrency,
    description: pkg.description ?? "",
    seoTitle: pkg.seoTitle ?? "",
    seoDescription: pkg.seoDescription ?? "",
    featured: pkg.featured,
  };
}

type Part = "core" | "pricing" | "listing" | "offer";

/** The fields each part of the package details owns. A part saves only its own. */
const PART_FIELDS: Record<Part, (keyof PackageFormValues)[]> = {
  core: ["title", "destinationId", "category", "nights", "adults", "children", "subtitle", "summary"],
  pricing: ["minNights", "pricingBasis", "baseCurrency"],
  listing: ["description", "seoTitle", "seoDescription", "featured"],
  // A flight, hotel reservation or visa: what is on offer, and what it costs.
  offer: ["details", "fromPrice", "baseCurrency"],
};
/** Holiday-only facts (style, nights, party) aren't part of a flight, hotel reservation or visa. */
const HOLIDAY_ONLY = new Set<keyof PackageFormValues>(["category", "nights", "adults", "children"]);

const fieldsOf = (part: Part, type: string) =>
  PART_FIELDS[part].filter((key) => isHoliday(type) || !HOLIDAY_ONLY.has(key));

const pick = (values: PackageFormValues, part: Part) =>
  Object.fromEntries(fieldsOf(part, values.productType).map((key) => [key, values[key]]));

/** One part of the package details, with its own Save. */
function DetailsForm({
  pkg,
  part,
  onSaved,
  properties,
}: {
  pkg: AdminPackageDetail;
  part: Part;
  onSaved: (pkg: AdminPackageDetail) => void;
  properties?: AdminReference["properties"];
}) {
  const [destinations, setDestinations] = useState<DestinationResponse[]>([]);
  const [values, setValues] = useState(() => toValues(pkg));
  const saver = useSaver();

  useEffect(() => {
    if (part !== "core") return;
    packagesApi
      .destinations()
      .then(setDestinations)
      .catch(() => undefined);
  }, [part]);

  // Another part (or the server) may have changed a field this part shares, such as the nights.
  const saved = toValues(pkg);
  const dirty = JSON.stringify(pick(values, part)) !== JSON.stringify(pick(saved, part));

  const other = !isHoliday(pkg.productType);
  const offerProblem =
    part === "offer" && other ? detailsProblem(pkg.productType as OtherType, values.details) : undefined;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (offerProblem) {
      saver.setFieldErrors({ details: [offerProblem] });
      return;
    }
    if (part === "offer") {
      const type = pkg.productType as OtherType;
      saver.run(
        () =>
          adminPackagesApi.update(pkg.id, {
            details: detailsToPayload(type, values.details, values.baseCurrency.trim()),
            fromPriceMinor: fromPriceMinor(type, values.details, values.fromPrice),
            baseCurrency: values.baseCurrency.trim(),
          }),
        (updated) => {
          onSaved(updated);
          setValues((current) => ({ ...current, ...pick(toValues(updated), part) }));
        },
        (err) => saver.setFieldErrors(err instanceof ApiError ? err.fieldErrors : undefined),
      );
      return;
    }
    const own = pick(values, part) as Partial<PackageFormValues>;
    const trimmed = Object.fromEntries(
      Object.entries(own).map(([key, value]) => [key, typeof value === "string" ? value.trim() : value]),
    );
    saver.run(
      () =>
        adminPackagesApi.update(pkg.id, {
          ...trimmed,
          ...(part === "pricing" ? { pricingBasis: values.pricingBasis as "PerParty" | "PerPerson" } : {}),
        }),
      (updated) => {
        onSaved(updated);
        setValues((current) => ({ ...current, ...pick(toValues(updated), part) }));
      },
      (err) => saver.setFieldErrors(err instanceof ApiError ? err.fieldErrors : undefined),
    );
  }

  return (
    <form onSubmit={submit}>
      <PackageFields
        part={part === "offer" ? "typeDetails" : part}
        properties={properties}
        values={values}
        onChange={(next) => {
          saver.clearSaved();
          setValues(next);
        }}
        destinations={destinations}
        fieldErrors={saver.fieldErrors}
        disabled={saver.saving}
      />
      {offerProblem && saver.fieldErrors?.details && <span className="field-error">{offerProblem}</span>}
      <SaveBar dirty={dirty} {...saver} />
    </form>
  );
}

type TabId = "details" | "offer" | "stays" | "pricing" | "included" | "addons" | "photos" | "listing";

const TABS: { id: TabId; label: string; count?: (pkg: AdminPackageDetail) => number }[] = [
  { id: "details", label: "Details" },
  { id: "offer", label: "Offer" },
  { id: "stays", label: "Stays", count: (p) => p.stays.length },
  { id: "pricing", label: "Pricing", count: (p) => p.rates.length },
  { id: "included", label: "Included", count: (p) => p.features.length },
  { id: "addons", label: "Add-ons", count: (p) => p.addOns.length },
  { id: "photos", label: "Photos", count: (p) => p.media.length },
  { id: "listing", label: "Listing" },
];

/** The tabs a kind of listing has: holidays build on stays and rates, the others on one "Offer" form. */
const tabsFor = (type: string) =>
  TABS.filter((t) => (isHoliday(type) ? t.id !== "offer" : !["stays", "pricing", "addons"].includes(t.id)));

/** What a draft still needs before it can go live, and the tab where each is fixed. */
function readiness(pkg: AdminPackageDetail): { label: string; met: boolean; tab: TabId }[] {
  if (!isHoliday(pkg.productType)) {
    return [
      { label: "A summary", met: !!pkg.summary?.trim(), tab: "details" },
      { label: `The ${typeLabel(pkg.productType).toLowerCase()} details`, met: !!pkg.details, tab: "offer" },
      { label: "A main photo", met: pkg.media.filter((m) => m.role === "Hero").length === 1, tab: "photos" },
    ];
  }
  const placed = pkg.stays.reduce((sum, s) => sum + s.nights, 0);
  return [
    { label: "A summary", met: !!pkg.summary?.trim(), tab: "details" },
    { label: "At least one stay", met: pkg.stays.length > 0, tab: "stays" },
    { label: "Stays that add up to the nights", met: pkg.stays.length > 0 && placed === pkg.nights, tab: "stays" },
    {
      label: `A ${pkg.baseCurrency} rate`,
      met: pkg.rates.some((r) => r.currency === pkg.baseCurrency),
      tab: "pricing",
    },
    { label: "A main photo", met: pkg.media.filter((m) => m.role === "Hero").length === 1, tab: "photos" },
  ];
}

/** The tabs, in the order a package is built. Arrow keys move between them. */
function TabStrip({
  pkg,
  active,
  onSelect,
}: {
  pkg: AdminPackageDetail;
  active: TabId;
  onSelect: (id: TabId) => void;
}) {
  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const tabs = tabsFor(pkg.productType);
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const index = tabs.findIndex((t) => t.id === active);
    const next = tabs[(index + step + tabs.length) % tabs.length];
    onSelect(next.id);
    document.getElementById(`tab-${next.id}`)?.focus();
  }

  return (
    <div className="pk-jump" role="tablist" aria-label="Sections" onKeyDown={onKeyDown}>
      {tabsFor(pkg.productType).map((t) => {
        const count = t.count?.(pkg);
        return (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            type="button"
            role="tab"
            aria-selected={active === t.id}
            aria-controls={`panel-${t.id}`}
            tabIndex={active === t.id ? 0 : -1}
            onClick={() => onSelect(t.id)}
          >
            {t.label}
            {count !== undefined && count > 0 && <span className="pk-tab-count">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** A tab's content. Hidden tabs stay mounted, so nothing typed in one is lost by looking at another. */
function TabPanel({ id, active, children }: { id: TabId; active: TabId; children: React.ReactNode }) {
  return (
    <div
      role="tabpanel"
      id={`panel-${id}`}
      aria-labelledby={`tab-${id}`}
      hidden={active !== id}
      className="pk-sections"
    >
      {children}
    </div>
  );
}

/** The editor's shape, while its data is on the way. */
function EditSkeleton() {
  return (
    <div className="pk" role="status" aria-label="Loading package">
      <div className="pk-header">
        <div className="pk-stack" style={{ gap: 14 }}>
          <Skeleton w={220} h={13} />
          <Skeleton w={340} h={28} />
          <Skeleton w={420} h={14} />
        </div>
      </div>
      <div className="pk-jump" style={{ position: "static" }}>
        {[60, 44, 62, 66, 66, 56, 52].map((w, i) => (
          <span key={i} style={{ padding: "14px 0", marginRight: 24, display: "inline-block" }}>
            <Skeleton w={w} h={13} />
          </span>
        ))}
      </div>
      <div className="pk-edit">
        <div className="pk-sections">
          <div className="pk-panel-outer">
            <div className="pk-panel" data-split>
              <div className="pk-panel-head">
                <div className="pk-stack" style={{ gap: 10 }}>
                  <Skeleton w={120} h={16} />
                  <Skeleton w={200} h={12} />
                </div>
              </div>
              <div className="pk-panel-body">
                <div className="pk-stack" style={{ gap: 18 }}>
                  {Array.from({ length: 6 }, (_, n) => (
                    <div className="pk-stack" key={n} style={{ gap: 8 }}>
                      <Skeleton w={110} h={12} />
                      <Skeleton w="100%" h={36} r={6} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="pk-rail">
          <div className="card">
            <div className="pk-stack" style={{ gap: 12 }}>
              <Skeleton w={70} h={14} />
              <Skeleton w={110} h={22} r={6} />
              <Skeleton w="100%" h={36} r={6} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PackageEditor() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // The address holds the tab, so a refresh or a shared link opens the same one.
  const requested = params.get("tab");
  const [kind, setKind] = useState("HolidayPackage");
  const tab: TabId = tabsFor(kind).some((t) => t.id === requested) ? (requested as TabId) : "details";
  function selectTab(next: TabId) {
    const query = new URLSearchParams(params.toString());
    if (next === "details") query.delete("tab");
    else query.set("tab", next);
    const qs = query.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const [pkg, setPkg] = useState<AdminPackageDetail | null>(null);
  const [reference, setReference] = useState<AdminReference | null>(null);
  // What customers see, for the price checker. Only published packages have one.
  const [live, setLive] = useState<PackageDetail | null>(null);
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);

  useEffect(() => {
    Promise.all([adminPackagesApi.get(id), adminPackagesApi.reference()])
      .then(([detail, refs]) => {
        setKind(detail.productType);
        setPkg(detail);
        setReference(refs);
      })
      .catch((err) =>
        setError({
          message: err instanceof Error ? err.message : "The package couldn't be loaded.",
          status: err instanceof ApiError ? err.status : undefined,
        }),
      );
  }, [id]);

  const slug = pkg?.slug;
  const published = pkg?.status === "Published";
  const savedAt = pkg?.updatedAt;
  useEffect(() => {
    if (!slug || !published) {
      setLive(null);
      return;
    }
    packagesApi
      .get(slug)
      .then(setLive)
      .catch(() => setLive(null)); // the price checker just stays out
  }, [slug, published, savedAt]);

  if (error) {
    return (
      <ProtectedPage wide>
        <div className="pk">
          <Crumbs trail={[{ label: "Packages", href: "/admin/packages" }, { label: "Package" }]} />
          <Notice tone="error">{error.status === 404 ? "This package doesn't exist." : error.message}</Notice>
          <Link className="btn btn-quiet" href="/admin/packages">
            Back to packages
          </Link>
        </div>
      </ProtectedPage>
    );
  }

  if (!pkg || !reference) {
    return (
      <ProtectedPage wide>
        <EditSkeleton />
      </ProtectedPage>
    );
  }

  const setMedia = (media: PackageMedia[]) => setPkg({ ...pkg, media });
  const holiday = isHoliday(pkg.productType);
  const checks = readiness(pkg);
  const outstanding = checks.filter((c) => !c.met);

  return (
    <ProtectedPage wide>
      <div className="pk">
        <Crumbs trail={[{ label: "Packages", href: "/admin/packages" }, { label: pkg.title }]} />
        <div className="pk-header">
          <div>
            <div className="pk-heading">
              <h1 className="pk-title">{pkg.title}</h1>
              <StatusBadge status={pkg.status} />
            </div>
            <p className="pk-meta">
              {!holiday && <span>{typeLabel(pkg.productType)}</span>}
              <span>{pkg.destination.name}</span>
              {holiday ? (
                <>
                  <span>
                    {pkg.nights} {pkg.nights === 1 ? "night" : "nights"}
                  </span>
                  <span>{party(pkg.adults, pkg.children)}</span>
                </>
              ) : (
                detailsSummary(pkg.productType, pkg.details) && (
                  <span>{detailsSummary(pkg.productType, pkg.details)}</span>
                )
              )}
              <span>
                {pkg.fromPriceMinor != null ? (
                  <>
                    From <strong>{money(pkg.fromPriceMinor, pkg.baseCurrency)}</strong>
                  </>
                ) : (
                  "No price yet"
                )}
              </span>
              <span title={fullDate(pkg.updatedAt)}>Updated {timeAgo(pkg.updatedAt)}</span>
            </p>
          </div>
        </div>

        <TabStrip pkg={pkg} active={tab} onSelect={selectTab} />

        <div className="pk-edit">
          <div className="pk-tabpanels">
            <TabPanel id="details" active={tab}>
              <Panel id="details" title="Details" description="The name and facts customers see first.">
                <DetailsForm pkg={pkg} part="core" onSaved={setPkg} />
              </Panel>
            </TabPanel>

            {!holiday && (
              <TabPanel id="offer" active={tab}>
                <Panel
                  id="offer"
                  title={`${typeLabel(pkg.productType)} details`}
                  description="What the customer is being offered, and what it costs."
                >
                  <DetailsForm pkg={pkg} part="offer" onSaved={setPkg} properties={reference.properties} />
                </Panel>
              </TabPanel>
            )}

            {holiday && (
              <>
                <TabPanel id="stays" active={tab}>
                  <Panel
                    id="stays"
                    title="Where you stay"
                    description="The lodges and camps, in the order guests visit them."
                  >
                    <StaysEditor pkg={pkg} reference={reference} onSaved={setPkg} />
                  </Panel>
                </TabPanel>

                <TabPanel id="pricing" active={tab}>
                  <Panel
                    id="pricing"
                    title="Pricing"
                    description="How the package is priced, and the shortest stay guests can book."
                  >
                    <DetailsForm pkg={pkg} part="pricing" onSaved={setPkg} />
                  </Panel>
                  <Panel
                    id="rates"
                    title="Season rates"
                    description="What it costs in each season. The from-price on the site comes from these."
                  >
                    <RatesEditor pkg={pkg} reference={reference} onSaved={setPkg} />
                  </Panel>
                </TabPanel>
              </>
            )}

            <TabPanel id="included" active={tab}>
              <Panel
                id="included"
                title="What's included"
                description="Choose from the shared list, or write a line for this one only."
              >
                <FeaturesEditor pkg={pkg} reference={reference} onSaved={setPkg} />
              </Panel>
            </TabPanel>

            {holiday && (
              <TabPanel id="addons" active={tab}>
                <Panel id="addons" title="Add-ons" description="Extras guests can add when they get a price.">
                  <AddOnsEditor pkg={pkg} onSaved={setPkg} />
                </Panel>
              </TabPanel>
            )}

            <TabPanel id="photos" active={tab}>
              <Panel
                id="photos"
                title="Photos"
                description="The first photo leads the package card. Add as many as you like."
              >
                <PhotoManager packageId={pkg.id} media={pkg.media} onChange={setMedia} />
              </Panel>
            </TabPanel>

            <TabPanel id="listing" active={tab}>
              <Panel
                id="listing"
                title="Listing"
                description="The longer description, how the page appears in search results, and whether it is featured."
              >
                <DetailsForm pkg={pkg} part="listing" onSaved={setPkg} />
              </Panel>
            </TabPanel>
          </div>

          <aside className="pk-rail">
            <PublishPanel pkg={pkg} onChange={setPkg} />

            {pkg.status !== "Published" && (
              <section className="pk-summary" aria-labelledby="ready-title">
                <h2 id="ready-title">Ready to publish</h2>
                <div className="pk-check">
                  <ul>
                    {checks.map((c) => (
                      <li key={c.label} data-met={c.met || undefined}>
                        <i className={`fa-solid ${c.met ? "fa-circle-check" : "fa-circle"}`} aria-hidden="true"></i>
                        {c.met ? (
                          <span>
                            {c.label}
                            <span className="sr-only">, done</span>
                          </span>
                        ) : (
                          <button type="button" className="pk-link" onClick={() => selectTab(c.tab)}>
                            {c.label}
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                  <p className="pk-check-note">
                    {outstanding.length === 0
                      ? "Everything needed is in. Publish when you're ready."
                      : `${outstanding.length} still needed. Select one to go to it.`}
                  </p>
                </div>
              </section>
            )}

            {live && holiday && (tab === "pricing" || tab === "addons") && <QuoteChecker pkg={live} />}
          </aside>
        </div>
      </div>
    </ProtectedPage>
  );
}

export default function PackageDetailPage() {
  // useSearchParams needs a Suspense boundary so the page can still be prepared ahead of time.
  return (
    <Suspense fallback={null}>
      <PackageEditor />
    </Suspense>
  );
}
