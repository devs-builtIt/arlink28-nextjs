import { FAQ } from "@/content/home-proof";

export type Faq = { q: string; a: string };

const NOTHING_CHARGED: Faq = {
  q: "Do I pay anything when I send a request?",
  a: "No. Sending a request is free, and nothing is charged until you have seen the price and agreed to it.",
};

/**
 * The questions under each service page. They follow what the home page FAQ already says (we are an agency and
 * enquiry service, a person replies with a price, nothing is charged until you agree, changes follow the
 * supplier's own rules). Review the wording against the real terms before launch.
 */
export const SERVICE_FAQS: Record<
  "flights" | "hotels" | "visas" | "packages" | "services" | "travel" | "elite",
  Faq[]
> = {
  flights: [
    {
      q: "How do I book a flight with ARLink28?",
      a: "Send a quote request with your route and dates. A member of the team replies with options and a price, and books it once you agree.",
    },
    {
      q: "Which routes can you quote?",
      a: "Regional flights across Africa, long-haul to Europe and the Gulf, and the cities in between. If you do not see your route, send it anyway and we check.",
    },
    NOTHING_CHARGED,
    {
      q: "Can I change or cancel a flight?",
      a: "Changes and cancellations follow the airline's own rules. Contact us with your reference and we take you through the options and any fees.",
    },
    {
      q: "Can you arrange my hotel and visa with the flight?",
      a: "Yes. We can plan the flight, the hotel and the visa support together, so it is one conversation and the dates fit each other.",
    },
  ],
  hotels: [
    {
      q: "How do I reserve a hotel?",
      a: "Tell us the city, your dates and how many are travelling. A member of the team replies with options and a price, and reserves the room once you agree.",
    },
    NOTHING_CHARGED,
    {
      q: "Can you find a hotel that is not listed here?",
      a: "Yes. Tell us the city, the dates and your budget and we search for you.",
    },
    {
      q: "Can I change or cancel a reservation?",
      a: "Changes and cancellations follow the hotel's own rules. Contact us with your reference and we take you through the options and any fees.",
    },
    {
      q: "Can you pair the hotel with flights and transfers?",
      a: "Yes. We can arrange the flight, the stay and the airport transfer together so your arrival times line up.",
    },
  ],
  visas: [
    {
      q: "What does visa support include?",
      a: "We guide the application and the documents for the country you are travelling to and check them with you before you submit. The decision on a visa is always made by the country's own authority.",
    },
    {
      q: "Which countries do you cover?",
      a: "Tell us your nationality and where you are travelling and we confirm the requirements for that route.",
    },
    {
      q: "How long does a visa take?",
      a: "It depends on the country and the type of visa. We tell you the expected time for your route when we reply, so you can plan your booking around it.",
    },
    NOTHING_CHARGED,
    {
      q: "Can you arrange my flight as well?",
      a: "Yes. We can arrange it alongside your flight so it is one conversation.",
    },
  ],
  packages: [
    {
      q: "How do I book a holiday package?",
      a: "Choose a package and send an enquiry with your dates. A member of the team replies with the details and a price, and books it once you agree.",
    },
    {
      q: "What is included in a package?",
      a: "Each package page lists what is included and the starting price. The team confirms anything you are unsure about before you agree.",
    },
    {
      q: "Can I change a package to suit me?",
      a: "Tell us what you would like changed and the team replies with what is possible and the price.",
    },
    NOTHING_CHARGED,
    {
      q: "Can you add flights and visa support to a package?",
      a: "Yes. We can arrange the flights and the visa support alongside the package so it is one booking conversation.",
    },
  ],
  services: [
    {
      q: "What does ARLink28 arrange?",
      a: "Flights, hotels, visa support, holidays, private jets, group travel, transfers and travel insurance, arranged by people you can speak to.",
    },
    FAQ[0],
    NOTHING_CHARGED,
    {
      q: "Can one team handle several services at once?",
      a: "Yes. Tell us the whole trip and the same team plans the flight, the stay, the visa and the transfers together.",
    },
    FAQ[5],
  ],
  elite: [
    {
      q: "How do I request a charter?",
      a: "Tell us where you want to fly, when, and with how many people. Choose a tier, or tell us what you have in mind. A member of the Elite team replies with aircraft options and a quote.",
    },
    NOTHING_CHARGED,
    {
      q: "What is the difference between the tiers?",
      a: "Each tier covers more of the journey around the flight. Every card lists what it includes, and a tier that builds on another says so, with everything in the one before plus more.",
    },
    {
      q: "Are ground transfers included?",
      a: "Yes, ground transfers come with the charter. The tier you choose sets the level of personal service around it.",
    },
  ],
  travel: [FAQ[0], FAQ[1], FAQ[2], FAQ[3], FAQ[4]],
};
