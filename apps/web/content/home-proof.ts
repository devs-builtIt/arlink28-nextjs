// The proof the homepage shows. Everything marked [..] is a PLACEHOLDER: no real figure has been supplied yet.
//
// Placeholders render in square brackets so nobody mistakes them for a claim. To go live, replace each
// bracketed value with a figure the business can stand behind and set SAMPLE to false; the brackets are
// only drawn while SAMPLE is true. A row whose value is null is left out entirely.

export const SAMPLE = true;

export const WHATSAPP_NUMBER = "2347047009128";
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;
export const PHONES = [
  { label: "+234 704 700 9128", href: "tel:+2347047009128" },
  { label: "+44 753 907 1257", href: "tel:+447539071257" },
];

/** The rating line on the hero photo. 4.8 on Google is the owner's figure; the review count is still a placeholder. */
export const RATING = { value: "4.8", platform: "Google reviews", count: "200 reviews" };

/** The reviews summary card. */
export const REVIEW_SUMMARY = { score: "4.8", basis: "Based on 200 reviews on Google" };

/** Real photographs already on the site, laid out as a tilted collage. Captions to be confirmed by the owner. */
export const COLLAGE = [
  {
    src: "/images/home/proof-harare.webp",
    alt: "ARLink28 team members at the Spotlight on Africa and Indian Ocean Islands TravelExpo in Harare",
    caption: "TravelExpo, Harare",
    rotate: -6,
  },
  {
    src: "/images/home/livery-1200.webp",
    alt: "An aircraft in ARLink28 livery taking off at sunset",
    caption: "Our livery",
    rotate: 5,
  },
  {
    src: "/images/home/proof-farnborough.webp",
    alt: "The Apex of Aviation sign at the Farnborough International Airshow",
    caption: "Farnborough Airshow",
    rotate: -3,
  },
  {
    src: "/images/home/proof-lords.webp",
    alt: "A session in the House of Lords on African leadership",
    caption: "House of Lords",
    rotate: 7,
  },
];

/** The count beside the partner carousel. */
export const HAPPY = { value: "12,000+", label: "Happy sponsors" };

/** The partner logos the About page already shows. Confirm each has permission before launch. */
export const PARTNER_LOGOS = [
  { name: "Travelstart", src: "/images/partners/travelstart.png" },
  { name: "iVisa", src: "/images/partners/ivisa.png" },
  { name: "Viator", src: "/images/partners/viator.png" },
  { name: "Trip.com", src: "/images/partners/trip.png" },
  { name: "Sherpa", src: "/images/partners/sherpa.png" },
  { name: "GetYourGuide", src: "/images/partners/getyourguide.png" },
  { name: "Giraffe Manor", src: "/images/partners/giraffe-manor.png" },
  { name: "Blue Ocean Resort & Residences", src: "/images/partners/blue-ocean.png" },
];

/** Partners the business has written permission to name. Empty until confirmed. */
export const PARTNERS: string[] = [];

/** Review cards. Placeholder until real, permitted customer words replace them. */
export const REVIEWS: { name: string; route: string; text: string; source: string }[] = [
  {
    name: "[Customer name]",
    route: "[Route or service]",
    text: "[A real customer's words, with their permission. Two or three sentences about what we arranged and how it went.]",
    source: "[Source]",
  },
  {
    name: "[Customer name]",
    route: "[Route or service]",
    text: "[A real customer's words, with their permission.]",
    source: "[Source]",
  },
  {
    name: "[Customer name]",
    route: "[Route or service]",
    text: "[A real customer's words, with their permission. A line or two about the booking and the support.]",
    source: "[Source]",
  },
  {
    name: "[Customer name]",
    route: "[Route or service]",
    text: "[A real customer's words, with their permission. Two or three sentences about what we arranged.]",
    source: "[Source]",
  },
  {
    name: "[Customer name]",
    route: "[Route or service]",
    text: "[A real customer's words, with their permission.]",
    source: "[Source]",
  },
  {
    name: "[Customer name]",
    route: "[Route or service]",
    text: "[A real customer's words, with their permission. A line or two about how it went.]",
    source: "[Source]",
  },
];

/** Where "Read all reviews on Google" goes. Replace with the business's own Google reviews link when it is to hand. */
export const GOOGLE_REVIEWS_URL = "https://www.google.com/search?q=ARLink28+reviews";

/** Routes to start a quote from. These pre-fill the form; they are not fares and carry no price. */
export const ROUTES: {
  from: string;
  to: string;
  fromCity: string;
  toCity: string;
  photo: string;
  wide?: boolean;
}[] = [
  { from: "LOS", to: "ACC", fromCity: "Lagos", toCity: "Accra", photo: "/images/home/route-acc.webp" },
  { from: "JNB", to: "VFA", fromCity: "Johannesburg", toCity: "Victoria Falls", photo: "/images/home/route-vfa.webp" },
  {
    from: "JNB",
    to: "BBK",
    fromCity: "Johannesburg",
    toCity: "Chobe National Park",
    photo: "/images/home/route-chobe.webp",
    wide: true,
  },
  {
    from: "JNB",
    to: "CPT",
    fromCity: "Johannesburg",
    toCity: "Cape Town",
    photo: "/images/home/route-cpt.webp",
    wide: true,
  },
  { from: "LOS", to: "CAI", fromCity: "Lagos", toCity: "Pyramids of Giza", photo: "/images/home/route-giza.webp" },
  { from: "ADD", to: "NBO", fromCity: "Addis Ababa", toCity: "Nairobi", photo: "/images/home/route-nbo.webp" },
];

/** The six reasons on the homepage. Each must be something the business can show. */
export const WHY: {
  icon: "person" | "layers" | "pin" | "message" | "shield" | "globe";
  title: string;
  text: string;
}[] = [
  {
    icon: "person",
    title: "A person prices every trip",
    text: "No algorithm guesses your fare. Someone on the team checks it and replies.",
  },
  {
    icon: "layers",
    title: "Flight, hotel and visa in one thread",
    text: "Your dates, your documents and your first night are planned against each other.",
  },
  {
    icon: "pin",
    title: "Offices in Lagos and London",
    text: "Real addresses, real people, in the two cities many of our travellers fly between.",
  },
  {
    icon: "message",
    title: "Phone and email support",
    text: "Message or call the same team that quoted you, before and after you travel.",
  },
  {
    icon: "shield",
    title: "Clear change and refund rules",
    text: "What changes, what costs and what is refunded is written down before you pay.",
  },
  {
    icon: "globe",
    title: "Routes across Africa and beyond",
    text: "Regional hops, long-haul to Europe and the Gulf, and the cities in between.",
  },
];

export const FAQ = [
  {
    q: "Is ARLink28 an airline?",
    a: "Not yet. Today ARLink28 is a travel agency and enquiry service: we quote and arrange flights, hotels, visa support and holidays on airlines and partners. We are building towards an airline of our own.",
  },
  {
    q: "How do I book a flight with ARLink28?",
    a: "Send a quote request with your route and dates. A member of the team replies with options and a price, and books it once you agree.",
  },
  {
    q: "Can you help with visas as well as flights?",
    a: "Yes. We guide the application and the documents for the country you are travelling to, and can arrange it alongside your flight so it is one conversation.",
  },
  {
    q: "Can I change or cancel a booking?",
    a: "Changes and cancellations follow the airline's or hotel's own rules. Contact us with your reference and we take you through the options and any fees. See the refund and cancellation policy for detail.",
  },
  {
    q: "How do I reach someone quickly?",
    a: "Call or email us. Replies depend on our staffed hours, which are shown on the contact page.",
  },
];
