// What the public site says about flights, hotel reservations and visa support: where each lives,
// what it is called, and how its stored details read to a customer. Plain functions, safe on server and client.
import { priceLabel } from "@/utils/packages";

export type PublicType = "Flight" | "HotelReservation" | "VisaSupport";

export const isPublicType = (type: string): type is PublicType => type in PUBLIC;

type Copy = {
  path: string;
  /** "flight", as in "View flight". */
  noun: string;
  /** "flights" */
  plural: string;
  /** "Flights" */
  title: string;
  heroTitle: string;
  heroText: string;
  metaTitle: string;
  metaDescription: string;
  /** Placeholder for the search box. */
  searchHint: string;
  /** What the price reads as: "Fares from", "Per night from". */
  priceFrom: string;
  /** The word after "Enquire about this". */
  enquire: string;
  cta: string;
};

export const PUBLIC: Record<PublicType, Copy> = {
  Flight: {
    path: "/flights",
    noun: "flight",
    plural: "flights",
    title: "Flights",
    heroTitle: "Flights, priced by people",
    heroText: "Tell us where you are going. We quote the fare and book it for you.",
    metaTitle: "Flights | ARLink28",
    metaDescription:
      "Flights across Africa and beyond. Send an enquiry and our team quotes the fare and books it for you.",
    searchHint: "Route, city or airline",
    priceFrom: "Fares from",
    enquire: "flight",
    cta: "View flight",
  },
  HotelReservation: {
    path: "/hotels",
    noun: "hotel",
    plural: "hotels",
    title: "Hotel reservations",
    heroTitle: "Hotel reservations",
    heroText: "Rooms we can book for you, with the nightly price up front.",
    metaTitle: "Hotel reservations | ARLink28",
    metaDescription:
      "Hotels and rooms we can reserve for you across Africa. See the room, the board and the cancellation terms.",
    searchHint: "Hotel, room or place",
    priceFrom: "Per night from",
    enquire: "hotel",
    cta: "View hotel",
  },
  VisaSupport: {
    path: "/visas",
    noun: "visa",
    plural: "visas",
    title: "Visa support",
    heroTitle: "Visa support",
    heroText: "We handle the application. See the fees, the wait and what you need to bring.",
    metaTitle: "Visa support | ARLink28",
    metaDescription:
      "Visa applications handled for you: our fee, the government fee, how long it takes and what you need.",
    searchHint: "Country or visa",
    priceFrom: "Service fee",
    enquire: "visa",
    cta: "View visa",
  },
};

/** The customer-facing address of a listing of any kind. */
export const publicPath = (type: string, slug: string) =>
  isPublicType(type) ? `${PUBLIC[type].path}/${slug}` : `/packages/${slug}`;

const TRIP: Record<string, string> = { OneWay: "One way", Return: "Return", MultiCity: "Multi-city" };
const CABIN: Record<string, string> = {
  Economy: "Economy",
  PremiumEconomy: "Premium economy",
  Business: "Business",
  First: "First class",
};
const BOARD: Record<string, string> = {
  RoomOnly: "Room only",
  BedAndBreakfast: "Bed and breakfast",
  HalfBoard: "Half board",
  FullBoard: "Full board",
  AllInclusive: "All inclusive",
};

type Details = Record<string, unknown>;
const text = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : null);
const asDetails = (details: unknown): Details => (details && typeof details === "object" ? (details as Details) : {});

const day = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const dateLabel = (iso: unknown) => (typeof iso === "string" ? day.format(new Date(`${iso}T00:00:00Z`)) : null);

/** The line a card shows under the title: the route, the room or the country. */
export function headline(type: string, details: unknown): string | null {
  const d = asDetails(details);
  if (type === "Flight") return [text(d.origin), text(d.destination)].filter(Boolean).join(" to ") || null;
  if (type === "HotelReservation") return text(d.hotelName) ?? text(d.roomType);
  if (type === "VisaSupport") return [text(d.country), text(d.visaType)].filter(Boolean).join(", ") || null;
  return null;
}

/** A few short facts for a card. */
export function cardFacts(type: string, details: unknown): string[] {
  const d = asDetails(details);
  const facts: (string | null)[] =
    type === "Flight"
      ? [TRIP[String(d.tripType)] ?? null, CABIN[String(d.cabin)] ?? null, text(d.airline)]
      : type === "HotelReservation"
        ? [text(d.roomType), BOARD[String(d.boardBasis)] ?? null]
        : type === "VisaSupport"
          ? [text(d.processingTime), text(d.validity) && `Valid ${text(d.validity)}`]
          : [];
  return facts.filter((f): f is string => !!f);
}

/** The rows of the "Details" table on a listing's own page. */
export function specRows(type: string, details: unknown, currency: string): { label: string; value: string }[] {
  const d = asDetails(details);
  const money = (minor: unknown) =>
    typeof minor === "number" ? priceLabel(minor, text(d.currency) ?? currency) : null;
  const rows: [string, string | null][] =
    type === "Flight"
      ? [
          ["From", text(d.origin)],
          ["To", text(d.destination)],
          ["Trip", TRIP[String(d.tripType)] ?? null],
          ["Cabin", CABIN[String(d.cabin)] ?? null],
          ["Airline", text(d.airline)],
          ["Baggage", text(d.baggage)],
          ["Offer valid until", dateLabel(d.validUntil)],
        ]
      : type === "HotelReservation"
        ? [
            ["Hotel", text(d.hotelName)],
            ["Room", text(d.roomType)],
            ["Board", BOARD[String(d.boardBasis)] ?? null],
          ]
        : type === "VisaSupport"
          ? [
              ["Country", text(d.country)],
              ["Visa", text(d.visaType)],
              ["Processing time", text(d.processingTime)],
              ["Valid for", text(d.validity)],
              ["Our service fee", money(d.serviceFeeMinor)],
              ["Government fee", money(d.governmentFeeMinor)],
            ]
          : [];
  return rows.filter((r): r is [string, string] => !!r[1]).map(([label, value]) => ({ label, value }));
}

/** Long text and lists from the details: fare notes, cancellation terms, what a visa needs. */
export function notes(type: string, details: unknown): { heading: string; text?: string; items?: string[] }[] {
  const d = asDetails(details);
  const out: { heading: string; text?: string; items?: string[] }[] = [];
  if (type === "Flight" && text(d.fareNotes)) out.push({ heading: "Fare notes", text: text(d.fareNotes)! });
  if (type === "HotelReservation" && text(d.cancellationTerms))
    out.push({ heading: "Cancellation", text: text(d.cancellationTerms)! });
  if (type === "VisaSupport" && Array.isArray(d.requirements) && d.requirements.length > 0)
    out.push({ heading: "What you need", items: d.requirements.filter((r): r is string => typeof r === "string") });
  return out;
}
