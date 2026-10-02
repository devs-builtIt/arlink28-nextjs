// What the catalogue sells, and the fields each kind needs beyond the shared ones (name, photos, status).
// Holiday packages keep their data in stays, rates and add-ons; the other kinds keep a flat `details` object.
import { fromMinor, toMinor } from "@/components/admin/format";

export type ProductType = "HolidayPackage" | "Flight" | "HotelReservation" | "VisaSupport" | "PrivateCharter";
export type OtherType = Exclude<ProductType, "HolidayPackage">;

export const PRODUCT_TYPES: { id: ProductType; label: string; plural: string; blurb: string }[] = [
  {
    id: "HolidayPackage",
    label: "Holiday package",
    plural: "Holiday packages",
    blurb: "Stays, season rates and inclusions, priced for a party.",
  },
  {
    id: "Flight",
    label: "Flight",
    plural: "Flights",
    blurb: "A route or fare we quote on request.",
  },
  {
    id: "HotelReservation",
    label: "Hotel reservation",
    plural: "Hotel reservations",
    blurb: "A hotel and room we can book, from a nightly price.",
  },
  {
    id: "VisaSupport",
    label: "Visa support",
    plural: "Visa support",
    blurb: "Help getting a visa for one country, with its fees and requirements.",
  },
  {
    id: "PrivateCharter",
    label: "Elite tier",
    plural: "Elite tiers",
    blurb: "A private aviation tier: what it includes, quoted on request.",
  },
];

export const isProductType = (value: string | null | undefined): value is ProductType =>
  PRODUCT_TYPES.some((t) => t.id === value);

export const typeLabel = (type: string) => PRODUCT_TYPES.find((t) => t.id === type)?.label ?? type;
export const isHoliday = (type: string) => type === "HolidayPackage";

export type DetailField = {
  key: string;
  label: string;
  kind: "text" | "textarea" | "select" | "date" | "money" | "lines" | "property";
  options?: [string, string][];
  placeholder?: string;
  hint?: string;
  required?: boolean;
  /** What to say when a required field is empty: "Say ...". */
  need?: string;
  max?: number;
  /** Shares a row with the field after it. */
  pair?: boolean;
};

const TRIP: [string, string][] = [
  ["OneWay", "One way"],
  ["Return", "Return"],
  ["MultiCity", "Multi-city"],
];
const CABIN: [string, string][] = [
  ["Economy", "Economy"],
  ["PremiumEconomy", "Premium economy"],
  ["Business", "Business"],
  ["First", "First"],
];
const BOARD: [string, string][] = [
  ["RoomOnly", "Room only"],
  ["BedAndBreakfast", "Bed and breakfast"],
  ["HalfBoard", "Half board"],
  ["FullBoard", "Full board"],
  ["AllInclusive", "All inclusive"],
];

const CHARTER_FIELDS: DetailField[] = [
  {
    key: "tier",
    label: "Tier",
    kind: "text",
    required: true,
    need: "the tier's name",
    placeholder: "Elite",
    max: 60,
    pair: true,
  },
  {
    key: "basedOn",
    label: "Builds on (slug)",
    kind: "text",
    max: 120,
    placeholder: "elite",
    hint: "Leave empty unless this tier adds to another.",
  },
  { key: "tagline", label: "One-line description", kind: "text", max: 300 },
  { key: "audience", label: "Who it is for", kind: "textarea", max: 600 },
  {
    key: "includes",
    label: "What it includes",
    kind: "lines",
    required: true,
    need: "what it includes",
    hint: "One item per line. For a tier that builds on another, list only what it adds.",
  },
];

export const DETAIL_FIELDS: Record<OtherType, DetailField[]> = {
  Flight: [
    {
      key: "origin",
      label: "From",
      kind: "text",
      required: true,
      need: "where it leaves from",
      placeholder: "Nairobi",
      max: 100,
      pair: true,
    },
    {
      key: "destination",
      label: "To",
      kind: "text",
      required: true,
      need: "where it goes to",
      placeholder: "Zanzibar",
      max: 100,
    },
    { key: "tripType", label: "Trip", kind: "select", options: TRIP, pair: true },
    { key: "cabin", label: "Cabin", kind: "select", options: CABIN },
    { key: "airline", label: "Airline", kind: "text", max: 100, pair: true },
    { key: "validUntil", label: "Offer valid until", kind: "date" },
    { key: "baggage", label: "Baggage", kind: "text", max: 300, placeholder: "One 23 kg bag and hand luggage" },
    {
      key: "fareNotes",
      label: "Fare notes",
      kind: "textarea",
      max: 2000,
      hint: "Changes, cancellations and anything else the fare depends on.",
    },
  ],
  HotelReservation: [
    { key: "propertyId", label: "One of our properties", kind: "property", pair: true },
    {
      key: "hotelName",
      label: "Hotel name",
      kind: "text",
      max: 200,
      hint: "Only needed when the hotel isn't one of ours.",
    },
    { key: "roomType", label: "Room", kind: "text", max: 100, placeholder: "Deluxe double", pair: true },
    { key: "boardBasis", label: "Board", kind: "select", options: BOARD },
    { key: "cancellationTerms", label: "Cancellation terms", kind: "textarea", max: 2000 },
  ],
  PrivateCharter: CHARTER_FIELDS,
  VisaSupport: [
    {
      key: "country",
      label: "Country",
      kind: "text",
      required: true,
      need: "which country",
      placeholder: "Kenya",
      max: 100,
      pair: true,
    },
    {
      key: "visaType",
      label: "Visa",
      kind: "text",
      required: true,
      need: "which kind of visa",
      placeholder: "eTA",
      max: 100,
    },
    {
      key: "processingTime",
      label: "Processing time",
      kind: "text",
      max: 100,
      placeholder: "3 to 5 working days",
      pair: true,
    },
    { key: "validity", label: "Valid for", kind: "text", max: 100, placeholder: "90 days" },
    { key: "serviceFee", label: "Our service fee", kind: "money", hint: "Shown as the from-price.", pair: true },
    { key: "governmentFee", label: "Government fee", kind: "money" },
    {
      key: "requirements",
      label: "What the applicant needs",
      kind: "lines",
      hint: "One item per line, such as a passport valid for six months.",
    },
  ],
};

/** What the price field is called for each kind. Visa support takes its price from the service fee. */
export const PRICE_LABEL: Record<OtherType, string | null> = {
  Flight: "Fares from",
  HotelReservation: "Per night from",
  VisaSupport: null,
  PrivateCharter: null,
};

export type DetailValues = Record<string, string>;

/** The form's text values for a stored details object. */
export function detailsFromApi(type: OtherType, details: unknown): DetailValues {
  const source = (details ?? {}) as Record<string, unknown>;
  const out: DetailValues = {};
  for (const field of DETAIL_FIELDS[type]) {
    const value = source[field.key === "serviceFee" || field.key === "governmentFee" ? `${field.key}Minor` : field.key];
    if (value == null) out[field.key] = "";
    else if (field.kind === "money") out[field.key] = fromMinor(Number(value));
    else if (field.kind === "lines") out[field.key] = Array.isArray(value) ? value.join("\n") : "";
    else out[field.key] = String(value);
  }
  return out;
}

/** The object the API stores. Empty fields are left out, so clearing one removes it. */
export function detailsToPayload(type: OtherType, values: DetailValues, currency: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const field of DETAIL_FIELDS[type]) {
    const raw = (values[field.key] ?? "").trim();
    if (!raw) continue;
    if (field.kind === "money") {
      const minor = toMinor(raw);
      if (minor != null) out[`${field.key}Minor`] = minor;
    } else if (field.kind === "lines") {
      out[field.key] = raw
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
    } else out[field.key] = raw;
  }
  if (type === "VisaSupport") out.currency = currency;
  return out;
}

/** What stops the details being saved, in words; undefined when they're fine. */
export function detailsProblem(type: OtherType, values: DetailValues): string | undefined {
  if (type === "HotelReservation") {
    return values.propertyId || values.hotelName?.trim()
      ? undefined
      : "Pick one of our properties or type the hotel's name.";
  }
  const missing = DETAIL_FIELDS[type].filter((f) => f.required && !values[f.key]?.trim());
  if (missing.length === 0) return undefined;
  return `Say ${missing.map((f) => f.need ?? f.label.toLowerCase()).join(" and ")}.`;
}

/** The "from" price the API should hold: the visa's service fee, or the price field. 0 clears it. */
export function fromPriceMinor(type: OtherType, values: DetailValues, fromPrice: string): number {
  const text = type === "VisaSupport" ? (values.serviceFee ?? "") : fromPrice;
  return toMinor(text.trim()) ?? 0;
}

/** One line for lists: the route, the room, the country and visa. */
export function detailsSummary(type: string, details: unknown): string {
  const d = (details ?? {}) as Record<string, unknown>;
  if (type === "Flight") return [d.origin, d.destination].filter(Boolean).join(" to ");
  if (type === "HotelReservation") return [d.hotelName, d.roomType].filter(Boolean).join(", ");
  if (type === "VisaSupport") return [d.country, d.visaType].filter(Boolean).join(", ");
  if (type === "PrivateCharter") return String(d.tagline ?? d.tier ?? "");
  return "";
}
