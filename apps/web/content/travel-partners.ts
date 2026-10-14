// The travel partners shown on the Travel page. Each links on to the matching booking page, where the partner's own
// links live. Descriptions say what the partner is, and nothing about prices or speed: those are theirs to state.

export type PartnerKind = "Flights" | "Visas" | "Experiences";

export type TravelPartner = {
  name: string;
  kind: PartnerKind;
  line: string;
  text: string;
  logo: string;
  href: string;
  cta: string;
};

const BY_KIND: Record<PartnerKind, { href: string; cta: string }> = {
  Flights: { href: "/book/flight", cta: "Compare flights" },
  Visas: { href: "/book/visa", cta: "See visa options" },
  Experiences: { href: "/book/holiday", cta: "See experiences" },
};

const p = (name: string, kind: PartnerKind, line: string, text: string, logo: string): TravelPartner => ({
  name,
  kind,
  line,
  text,
  logo,
  ...BY_KIND[kind],
});

export const TRAVEL_PARTNERS: TravelPartner[] = [
  p(
    "Travelstart",
    "Flights",
    "An African travel marketplace",
    "Flights, hotels and holiday packages across Africa and beyond.",
    "/images/partners/travelstart.png",
  ),
  p(
    "Trip.com",
    "Flights",
    "A global travel platform",
    "Flights, hotels, trains and car rentals in one place.",
    "/images/partners/trip.png",
  ),
  p(
    "iVisa",
    "Visas",
    "Online visa applications",
    "Visa, passport and travel document applications for many destinations.",
    "/images/partners/ivisa.png",
  ),
  p(
    "Sherpa",
    "Visas",
    "Entry requirements",
    "Travel restriction and entry requirement information for your route.",
    "/images/partners/sherpa.png",
  ),
  p(
    "GetYourGuide",
    "Experiences",
    "Tours and activities",
    "Tours, attractions and local experiences at your destination.",
    "/images/partners/getyourguide.png",
  ),
  p(
    "Viator",
    "Experiences",
    "A TripAdvisor company",
    "Bookable tours, excursions and attraction tickets.",
    "/images/partners/viator.png",
  ),
];
