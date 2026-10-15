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
  "flights" | "hotels" | "visas" | "packages" | "services" | "travel" | "elite" | "about" | "team" | "blogs" | "quote",
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
  about: [
    FAQ[0],
    {
      q: "Where is ARLink28 based?",
      a: "We have offices in Lagos and London. The addresses and opening hours are on the contact page.",
    },
    {
      q: "What does ARLink28 arrange?",
      a: "Flights, hotels, visa support, holidays, private jets, group travel, transfers and travel insurance, arranged by people you can speak to.",
    },
    FAQ[5],
    {
      q: "Can I work or partner with ARLink28?",
      a: "Yes. The opportunities page explains how to get involved, and you can write to us from the contact page.",
    },
  ],
  team: [
    {
      q: "Who will I deal with when I send a request?",
      a: "A member of the team replies with options and a price, and stays with you until the trip is arranged.",
    },
    {
      q: "Can I speak to someone directly?",
      a: "Yes. Call or email us and the right person picks it up. Replies depend on our staffed hours, which are shown on the contact page.",
    },
    {
      q: "Where is the team based?",
      a: "We work from Lagos and London, and the coordinators on this page cover aviation, finance, technology, partnerships and customer experience.",
    },
    NOTHING_CHARGED,
    {
      q: "Can I join the team or become a partner?",
      a: "Take a look at the opportunities page, then write to us from the contact page with a short note about yourself.",
    },
  ],
  quote: [
    {
      q: "What happens after I send a request?",
      a: "A member of the team reads it and replies with options and a price. You can ask questions or change the plan before you agree to anything.",
    },
    NOTHING_CHARGED,
    {
      q: "How long does a reply take?",
      a: "Replies depend on our staffed hours, which are shown on the contact page. If it is urgent, call us.",
    },
    {
      q: "What should I put in the request?",
      a: "Your route and dates, how many are travelling, and anything that matters to you. If you only have an idea, send that and we help shape it.",
    },
    {
      q: "Can I change my mind after I get a quote?",
      a: "Yes. A quote is not a booking. Nothing is arranged until you agree to it.",
    },
  ],
  blogs: [
    {
      q: "When will the guides be published?",
      a: "We have not published any posts yet. The first three are in the works, and they will appear on this page when they are ready.",
    },
    {
      q: "What will the guides cover?",
      a: "Travel stories and practical guides for the routes and destinations our travellers ask about most.",
    },
    {
      q: "Can I ask for a guide on a specific trip?",
      a: "Yes. Tell us the route you are planning from the contact page and we will take it into account.",
    },
    FAQ[1],
    NOTHING_CHARGED,
  ],
};
