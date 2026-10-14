// What each service is, in plain statements. Nothing here promises a price, a speed or a guarantee the business has
// not confirmed; confirm the insurance and transfer details with the owner before launch.

export type Service = {
  id: string;
  name: string;
  line: string;
  text: string;
  checks: string[];
  cta: string;
  href: string;
  image: string;
  alt: string;
  /** Where the photo is anchored when the box crops it. */
  focus?: string;
};

export const SERVICES: Service[] = [
  {
    id: "flight-booking",
    name: "Flight booking",
    line: "Domestic and international",
    text: "Tell us the route and the dates. We look across airlines, send you the options with a price, and book the one you choose once you agree.",
    checks: ["Options from several airlines", "Flexible-date searches", "Group bookings", "Changes handled with you"],
    cta: "Get a quote",
    href: "/quote",
    image: "/images/services/flights.webp",
    alt: "A passport in the shape of Africa beside a laptop showing a flight search",
    focus: "50% 88%",
  },
  {
    id: "hotel-reservations",
    name: "Hotel reservations",
    line: "Stays that suit your budget",
    text: "Name the city and your dates. We suggest hotels at your budget, confirm the price and availability, and book it with your flight if you want one conversation.",
    checks: [
      "Hotels matched to your budget",
      "Booked alongside your flight",
      "Group room requests",
      "Cancellation terms explained first",
    ],
    cta: "Get a quote",
    href: "/quote",
    image: "/images/services/hotels.webp",
    alt: "A hotel receptionist on the phone behind a brass reception sign",
    focus: "50% 30%",
  },
  {
    id: "visa-support",
    name: "Visa support",
    line: "Checked with you",
    text: "We guide the application and the documents for the country you are travelling to, and can arrange it alongside your flight so it is one conversation.",
    checks: ["A document list for your destination", "Help with the application", "Arranged alongside your flight"],
    cta: "See visa support",
    href: "/visas",
    image: "/images/home/team-support.webp",
    alt: "A member of the ARLink28 team on the phone at a desk",
    focus: "50% 12%",
  },
  {
    id: "holiday-packages",
    name: "Holiday packages",
    line: "Everything in one quote",
    text: "Choose a destination and we put the flights, the hotel and the transfers into one quote, with the price shown, so there is one thing to agree to.",
    checks: ["Packages with the price shown", "Custom itineraries", "Flexible dates", "Group travel"],
    cta: "See packages",
    href: "/packages",
    image: "/images/services/holidays.webp",
    alt: "A boarding pass, passport and camera on a desk beside a laptop",
    focus: "50% 88%",
  },
  {
    id: "private-jets",
    name: "Private jet charter",
    line: "Elite, Signature, Bespoke",
    text: "Charter a private aircraft with ground transfers and a meet and greet, in the tier that fits, from the essentials to a journey built around you.",
    checks: ["Elite, Signature and Bespoke tiers", "VIP ground transfers", "Airport meet and greet"],
    cta: "See the tiers",
    href: "/elite-jets",
    image: "/images/home/jet-challenger-604-1600.webp",
    alt: "A silver Challenger 604 with a red stripe on the apron",
  },
  {
    id: "corporate-group-travel",
    name: "Corporate and group travel",
    line: "Companies, schools, events",
    text: "We handle travel for companies, schools, NGOs and conference delegations: bulk flights, group hotel rates and coordinated transfers, handled by one team and priced before you commit.",
    checks: [
      "Bulk flight bookings",
      "Group hotel rates",
      "Conference logistics",
      "Invoice and PO support",
      "One point of contact",
      "Custom travel policies",
    ],
    cta: "Get a quote",
    href: "/quote",
    image: "/images/services/corporate.webp",
    alt: "Three colleagues walking through an airport with luggage beside an ARLink28 banner",
  },
  {
    id: "airport-transfers",
    name: "Airport transfers",
    line: "A driver waiting at arrival",
    text: "Add a pickup or a drop-off to your trip. We arrange the driver and agree the price with you before you travel.",
    checks: ["Meet and greet", "Group transfers", "Price agreed before you travel"],
    cta: "Get a quote",
    href: "/quote",
    image: "/images/services/transfers.webp",
    alt: "A family loading luggage into a black van at an airport",
  },
  {
    id: "travel-insurance",
    name: "Travel insurance",
    line: "Cover for the unexpected",
    text: "We can arrange travel insurance with your booking. What a plan covers depends on the plan, and we go through the cover and the exclusions with you before you buy.",
    checks: ["Medical cover", "Trip cancellation", "Lost luggage", "Flight delay"],
    cta: "Get a quote",
    href: "/quote",
    image: "/images/services/insurance.webp",
    alt: "A suitcase with a travel insurance tag",
  },
];
