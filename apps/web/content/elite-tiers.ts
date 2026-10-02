// The three Elite private-aviation tiers. They live in the catalogue as products of type PrivateCharter;
// this is the same content in code, used when the catalogue cannot be reached or has none yet, and as the
// source the tiers were created from.

export type EliteTier = {
  slug: string;
  title: string;
  tier: string;
  tagline: string;
  audience: string;
  /** Slug of the tier this one builds on. Its `includes` then lists only what it adds. */
  basedOn?: string;
  includes: string[];
  /** A photograph from /images/home that stands for the tier. */
  image: string;
  alt: string;
};

export const ELITE_TIERS: EliteTier[] = [
  {
    slug: "arlink28-elite",
    title: "ARLink28 Elite",
    tier: "Elite",
    tagline: "Private aviation essentials, professionally coordinated.",
    audience:
      "The core private aviation package for clients who want a seamless charter journey without extensive personalisation.",
    includes: [
      "Private aircraft charter",
      "VIP ground transfer",
      "Airport meet and greet",
      "Pre-flight travel coordination",
      "Dedicated booking support",
    ],
    image: "/images/home/jet-tarmac-900.webp",
    alt: "A private jet on the apron under a sunset sky",
  },
  {
    slug: "arlink28-elite-signature",
    title: "ARLink28 Elite Signature",
    tier: "Signature",
    tagline: "A more personalised and elevated private aviation experience.",
    audience: "For clients who want their journey to feel more personal, premium and thoughtfully curated.",
    basedOn: "arlink28-elite",
    includes: [
      "Premium in-flight catering",
      "Personalised cabin preferences",
      "Welcome gift for the client",
      "Enhanced guest-experience coordination",
      "Special dietary and hospitality requirements where available",
    ],
    image: "/images/home/jet-sunset-900.webp",
    alt: "A private jet parked on the tarmac at golden hour",
  },
  {
    slug: "arlink28-bespoke",
    title: "ARLink28 Bespoke",
    tier: "Bespoke",
    tagline: "A completely customised private aviation journey.",
    audience: "A fully tailored combination of services, built around the client's needs.",
    includes: [
      "Private aircraft charter",
      "VIP ground transfers",
      "Meet and greet",
      "Bespoke cabin styling and décor",
      "Specialised catering",
      "Personalised guest amenities",
      "Security arrangements",
      "Destination concierge",
      "Celebration arrangements",
      "Special occasions and welcome setups",
      "Custom gifts and hospitality requirements",
      "Other tailored travel requests based on the client's needs",
    ],
    image: "/images/home/jet-cabin-900.webp",
    alt: "The leather seats and oval windows of a private jet cabin",
  },
];

/** The details object stored on a tier's catalogue entry. */
export const tierDetails = (t: EliteTier) => ({
  tier: t.tier,
  tagline: t.tagline,
  audience: t.audience,
  ...(t.basedOn ? { basedOn: t.basedOn } : {}),
  includes: t.includes,
});
