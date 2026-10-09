// Stateful stand-in for arlink28-api, used by the Playwright suite.
//
// It serves the endpoints the admin portal calls, in the real API's shapes:
// plain JSON on success, 204 where the API has no body, and RFC 9457 Problem
// Details (with `code`) for every error. Tokens are JWT-shaped so the web app's
// middleware can decode them; the mock "verifies" a token by looking it up.
//
// POST /__reset restores the seed data between tests.
//
// The package catalogue is real data captured from arlink28-api after
// `seed-catalogue` (e2e/data/catalogue.json). Quotes follow the C# pricing
// rules, except that seasons match on month and day only, so the 2026 posters
// keep quoting when the tests run in later years.
import http from "node:http";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

const CATALOGUE = JSON.parse(readFileSync(new URL("./data/catalogue.json", import.meta.url), "utf8"));
const DEST_DATA = JSON.parse(readFileSync(new URL("./data/destinations.json", import.meta.url), "utf8"));

const PORT = Number(process.env.MOCK_API_PORT ?? 5399);
const HOUR = 3600_000;
const DAY = 24 * HOUR;

// Test-only accounts; e2e/fixtures.ts holds the same values for the specs.
const PASSWORDS = { anna_bello: "Runway-2026", kwame_mensah: "Taxiway-2026" };

const clone = (v) => JSON.parse(JSON.stringify(v));

// ── Admin packages ──
// The published packages come from the captured catalogue; the draft is what the
// API has after `seed-catalogue` for a poster whose data contradicts itself.
const REF_YEAR = new Date().getFullYear() + 1;
const byName = (a, b) => a.name.localeCompare(b.name);

/** The pickers' lists, derived from the captured catalogue. Season dates sit next year, so they never lapse mid-test. */
function buildReference() {
  const properties = new Map();
  const features = new Map();
  const seasons = new Map();
  for (const d of Object.values(CATALOGUE.details)) {
    for (const s of d.stays) {
      properties.set(s.propertySlug, {
        id: `prop-${s.propertySlug}`,
        slug: s.propertySlug,
        name: s.propertyName,
        destinationId: CATALOGUE.destinations.find((x) => x.name === s.destinationName)?.id ?? "",
        destinationName: s.destinationName,
      });
    }
    for (const f of d.features) {
      if (!features.has(f.label)) {
        features.set(f.label, {
          id: `feat-${features.size}`,
          slug: `feat-${features.size}`,
          label: f.label,
          icon: f.icon ?? null,
        });
      }
    }
    for (const r of d.rates) {
      seasons.set(r.seasonSlug, {
        id: `season-${r.seasonSlug}`,
        slug: r.seasonSlug,
        name: r.seasonName,
        ranges: CATALOGUE.seasons[r.seasonSlug].map(([a, b]) => ({
          start: `${REF_YEAR}-${a}`,
          end: `${REF_YEAR}-${b}`,
        })),
      });
    }
  }
  return {
    destinations: CATALOGUE.destinations,
    properties: [...properties.values()].sort(byName),
    seasons: [...seasons.values()].sort(byName),
    features: [...features.values()].sort((a, b) => a.label.localeCompare(b.label)),
  };
}
const REFERENCE = buildReference();

// ── Public catalogue: cards and details as the real API serves them ──
const seasonRanges = (slug) =>
  (CATALOGUE.seasons[slug] ?? []).map(([a, b]) => ({ start: `${REF_YEAR}-${a}`, end: `${REF_YEAR}-${b}` }));

/**
 * Published flights, hotel reservations and visa support, as the public API returns them. They live apart
 * from the catalogue, so the admin's counts and the holiday pages are unaffected.
 */
const PRODUCTS = (() => {
  const dest = (slug) => CATALOGUE.destinations.find((d) => d.slug === slug);
  const make = (productType, slug, title, destination, summary, fromPriceMinor, details, more = {}) => {
    const base = {
      id: `prod-${slug}`,
      slug,
      title,
      subtitle: null,
      summary,
      description: more.description ?? null,
      category: productType.toUpperCase(),
      destination: dest(destination),
      nights: 0,
      minNights: 0,
      adults: 0,
      children: 0,
      pricingBasis: "PerParty",
      baseCurrency: "USD",
      fromPriceMinor,
      featured: !!more.featured,
      seoTitle: null,
      seoDescription: null,
      productType,
      details,
    };
    return {
      card: { ...base, heroImagePath: null, highlights: [], lodges: [] },
      detail: { ...base, stays: [], features: more.features ?? [], addOns: [], media: [], rates: [] },
    };
  };
  const feature = (section, label, sortOrder) => ({ section, label, icon: null, footnote: null, sortOrder });
  return [
    make(
      "Flight",
      "nairobi-to-zanzibar",
      "Nairobi to Zanzibar",
      "nairobi",
      "Return fares on the coast run.",
      18000,
      {
        origin: "Nairobi",
        destination: "Zanzibar",
        tripType: "Return",
        cabin: "Economy",
        airline: "Coastal Air",
        baggage: "One 23 kg bag and hand luggage",
        fareNotes: "Changes are free up to 48 hours before departure.",
      },
      { featured: true },
    ),
    make("Flight", "mara-to-nairobi", "Masai Mara to Nairobi", "masai-mara", "A short hop after your safari.", null, {
      origin: "Masai Mara",
      destination: "Nairobi",
      tripType: "OneWay",
    }),
    make(
      "HotelReservation",
      "nairobi-city-hotel",
      "Nairobi City Hotel",
      "nairobi",
      "A quiet room close to the park.",
      9500,
      {
        hotelName: "Nairobi City Hotel",
        roomType: "Deluxe double",
        boardBasis: "BedAndBreakfast",
        cancellationTerms: "Free cancellation up to 7 days before arrival.",
      },
      { features: [feature("Included", "Breakfast for two", 0), feature("Included", "Airport pickup", 1)] },
    ),
    make("VisaSupport", "kenya-eta", "Kenya eTA", "nairobi", "We apply for your Kenya eTA.", 2500, {
      country: "Kenya",
      visaType: "eTA",
      processingTime: "3 working days",
      validity: "90 days",
      serviceFeeMinor: 2500,
      governmentFeeMinor: 3000,
      currency: "USD",
      requirements: ["Passport valid for six months", "Return ticket"],
    }),
    make(
      "PrivateCharter",
      "arlink28-elite-signature",
      "ARLink28 Elite Signature",
      "nairobi",
      "A tier from the catalogue.",
      0,
      {
        tier: "Signature",
        tagline: "Signature as the catalogue words it.",
        basedOn: "arlink28-elite",
        includes: ["Catalogue catering item", "Catalogue welcome item"],
      },
    ),
  ];
})();

/** A card: what the list shows, with three highlights and the lodges, as the API derives them. */
function publicCard(card) {
  if (card.productType) return card;
  const detail = CATALOGUE.details[card.slug];
  const label = (f) => f.label;
  const highlights = [
    ...detail.features.filter((f) => f.section === "Highlight").sort((a, b) => a.sortOrder - b.sortOrder),
    ...detail.features.filter((f) => f.section === "Included").sort((a, b) => a.sortOrder - b.sortOrder),
  ]
    .map(label)
    .slice(0, 3);
  const lodges = [
    ...new Set([...detail.stays].sort((a, b) => a.sortOrder - b.sortOrder).map((st) => st.propertyName)),
  ].slice(0, 3);
  return { ...card, highlights, lodges };
}

/** A detail, with each rate carrying the dates it covers. */
function publicDetail(detail) {
  return { ...detail, rates: detail.rates.map((r) => ({ ...r, ranges: seasonRanges(r.seasonSlug) })) };
}

const fromPrice = (pkg) => {
  const prices = pkg.rates.filter((r) => r.currency === pkg.baseCurrency).map((r) => r.priceMinor);
  return prices.length ? Math.min(...prices) : null;
};

/** The required fields per type, and the message the API gives when one is missing. */
const DETAIL_RULES = {
  Flight: [
    ["origin", "Say where the flight leaves from."],
    ["destination", "Say where the flight goes to."],
  ],
  HotelReservation: [],
  VisaSupport: [
    ["country", "Say which country the visa is for."],
    ["visaType", "Say which kind of visa this is."],
  ],
  PrivateCharter: [["tier", "Name the tier, for example Elite or Signature."]],
};
const DETAIL_KEYS = {
  Flight: ["origin", "destination", "tripType", "airline", "cabin", "baggage", "fareNotes", "validUntil"],
  HotelReservation: ["propertyId", "hotelName", "roomType", "boardBasis", "cancellationTerms"],
  VisaSupport: [
    "country",
    "visaType",
    "processingTime",
    "validity",
    "serviceFeeMinor",
    "governmentFeeMinor",
    "currency",
    "requirements",
  ],
  PrivateCharter: ["tier", "tagline", "audience", "basedOn", "includes"],
};
/** The details to store, or an error message. Unknown fields are dropped, as the API does. */
function normalizeDetails(type, raw) {
  if (!raw || typeof raw !== "object") return { error: "Fill in the details for this type first." };
  const out = {};
  for (const key of DETAIL_KEYS[type])
    if (raw[key] !== undefined && raw[key] !== null && raw[key] !== "") out[key] = raw[key];
  for (const [key, message] of DETAIL_RULES[type]) if (!String(out[key] ?? "").trim()) return { error: message };
  if (type === "HotelReservation" && !out.propertyId && !String(out.hotelName ?? "").trim())
    return { error: "Pick one of our properties or type the hotel's name." };
  return { value: out };
}

/** What a package still needs before it can be published: the API's checklist. */
function publishChecklist(pkg) {
  const missing = [];
  if (pkg.productType !== "HolidayPackage") {
    if (!pkg.title.trim()) missing.push("A name");
    if (!pkg.summary?.trim()) missing.push("A summary");
    if (!pkg.details) missing.push("The details for this type");
    if (pkg.media.filter((m) => m.role === "Hero").length !== 1) missing.push("A main photo");
    return missing;
  }
  const nightsWord = (n) => `${n} ${n === 1 ? "night" : "nights"}`;
  if (!pkg.title.trim()) missing.push("A name");
  if (!pkg.summary?.trim()) missing.push("A summary");
  if (pkg.minNights < 1 || pkg.nights < pkg.minNights)
    missing.push("Nights that are at least the minimum stay, and at least one");
  if (pkg.adults < 1) missing.push("At least one adult");
  const placed = pkg.stays.reduce((sum, s) => sum + s.nights, 0);
  if (pkg.stays.length === 0) missing.push("At least one stay");
  else if (placed !== pkg.nights)
    missing.push(`Stays that add up to ${nightsWord(pkg.nights)} (they add up to ${placed})`);
  if (!pkg.rates.some((r) => r.currency === pkg.baseCurrency))
    missing.push(`A ${pkg.baseCurrency} rate for a season that has not ended`);
  if (pkg.media.filter((m) => m.role === "Hero").length !== 1) missing.push("A main photo");
  return missing;
}

function buildAdminPackages() {
  const now = new Date().toISOString();
  const published = CATALOGUE.packages.map((p) => {
    const d = CATALOGUE.details[p.slug];
    return {
      id: p.id,
      slug: p.slug,
      status: "Published",
      title: p.title,
      subtitle: p.subtitle ?? null,
      summary: p.summary ?? null,
      description: d?.description ?? null,
      productType: "HolidayPackage",
      details: null,
      category: p.category,
      destination: clone(p.destination),
      nights: p.nights,
      minNights: d?.minNights ?? p.nights,
      adults: p.adults,
      children: p.children,
      pricingBasis: d?.pricingBasis ?? "PerParty",
      baseCurrency: p.baseCurrency,
      fromPriceMinor: p.fromPriceMinor,
      featured: p.featured,
      seoTitle: d?.seoTitle ?? null,
      seoDescription: d?.seoDescription ?? null,
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
      stays: (d?.stays ?? []).map((s) => ({
        id: s.id,
        propertyId: `prop-${s.propertySlug}`,
        propertyName: s.propertyName,
        destinationName: s.destinationName,
        nights: s.nights,
        roomType: s.roomType,
        sortOrder: s.sortOrder,
      })),
      features: (d?.features ?? []).map((f, i) => ({
        id: `${p.id}-feature-${i}`,
        section: f.section,
        featureId: null,
        label: f.label,
        icon: f.icon ?? null,
        footnote: f.footnote,
        sortOrder: f.sortOrder,
      })),
      rates: (d?.rates ?? []).map((r) => ({
        id: `${p.id}-${r.seasonSlug}-${r.currency}`,
        seasonId: `season-${r.seasonSlug}`,
        seasonName: r.seasonName,
        currency: r.currency,
        priceMinor: r.priceMinor,
        extraNightPriceMinor: r.extraNightPriceMinor,
      })),
      addOns: clone(d?.addOns ?? []),
      media: clone(d?.media ?? []),
    };
  });
  const draft = {
    id: "5a1a5fa0-0000-4000-8000-000000000001",
    slug: "salas-family-safari",
    status: "Draft",
    title: "Sala's Family Safari",
    subtitle: null,
    summary: null,
    description: null,
    productType: "HolidayPackage",
    details: null,
    category: "SAFARI",
    destination: clone(CATALOGUE.destinations.find((x) => x.slug === "masai-mara")),
    nights: 3,
    minNights: 3,
    adults: 2,
    children: 2,
    pricingBasis: "PerParty",
    baseCurrency: "USD",
    fromPriceMinor: null,
    featured: false,
    seoTitle: null,
    seoDescription: null,
    publishedAt: null,
    createdAt: now,
    updatedAt: now,
    stays: [],
    features: [],
    rates: [],
    addOns: [],
    media: [],
  };
  return [...published, draft];
}

const adminSummary = (p) => ({
  id: p.id,
  slug: p.slug,
  title: p.title,
  status: p.status,
  productType: p.productType,
  details: p.details,
  category: p.category,
  destination: p.destination,
  nights: p.nights,
  adults: p.adults,
  children: p.children,
  baseCurrency: p.baseCurrency,
  fromPriceMinor: p.fromPriceMinor,
  heroImagePath: p.media.find((m) => m.role === "Hero")?.path ?? null,
  mediaCount: p.media.length,
  updatedAt: p.updatedAt,
});

const slugify = (t) =>
  t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "package";

const readRaw = async (req) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
};

/** The file parts of a multipart body: [{ name, filename, data }]. */
function parseMultipart(buf, contentType) {
  const m = /boundary=(?:"([^"]+)"|([^;]+))/.exec(contentType ?? "");
  if (!m) return [];
  const delimiter = Buffer.from(`--${m[1] ?? m[2]}`);
  const parts = [];
  let start = buf.indexOf(delimiter);
  while (start !== -1) {
    const next = buf.indexOf(delimiter, start + delimiter.length);
    if (next === -1) break;
    const part = buf.subarray(start + delimiter.length + 2, next - 2);
    const split = part.indexOf("\r\n\r\n");
    const head = part.subarray(0, split).toString();
    parts.push({
      name: /name="([^"]*)"/.exec(head)?.[1],
      filename: /filename="([^"]*)"/.exec(head)?.[1],
      data: part.subarray(split + 4),
    });
    start = next;
  }
  return parts.filter((p) => p.filename !== undefined);
}

/** Identifies an image by its first bytes, like the API. */
function sniff(b) {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP") return "image/webp";
  return null;
}

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

function seed() {
  const now = Date.now();
  const iso = (ms) => new Date(ms).toISOString();
  const packages = buildAdminPackages();
  return {
    passwords: { ...PASSWORDS },
    packages,
    files: new Map(),
    tokens: new Map(),
    users: [
      {
        id: "u1",
        username: "anna_bello",
        email: "anna.bello@arlink28.test",
        role: "SuperAdmin",
        isActive: true,
        lastLoginAt: iso(now - 5 * 60_000),
        createdAt: iso(now - 90 * DAY),
      },
      {
        id: "u2",
        username: "kwame_mensah",
        email: "kwame.mensah@arlink28.test",
        role: "Operator",
        isActive: true,
        lastLoginAt: iso(now - 3 * HOUR),
        createdAt: iso(now - 60 * DAY),
      },
      {
        id: "u3",
        username: "fatima_diallo",
        email: "fatima.diallo@arlink28.test",
        role: "Operator",
        isActive: true,
        lastLoginAt: iso(now - 2 * DAY),
        createdAt: iso(now - 40 * DAY),
      },
      {
        id: "u4",
        username: "tunde_okafor",
        email: "tunde.okafor@arlink28.test",
        role: "SuperAdmin",
        isActive: true,
        lastLoginAt: iso(now - 6 * DAY),
        createdAt: iso(now - 30 * DAY),
      },
      {
        id: "u5",
        username: "grace_wanjiru",
        email: "grace.wanjiru@arlink28.test",
        role: "Operator",
        isActive: false,
        lastLoginAt: iso(now - 45 * DAY),
        createdAt: iso(now - 80 * DAY),
      },
      {
        id: "u6",
        username: "yusuf_bakare",
        email: "yusuf.bakare@arlink28.test",
        role: "Operator",
        isActive: true,
        lastLoginAt: null,
        createdAt: iso(now - DAY),
      },
    ],
    invites: new Map([["valid-invite", { email: "new.hire@arlink28.test", role: "Operator" }]]),
    resets: new Set(["valid-reset"]),
    enquiries: seedEnquiries(now, packages),
  };
}

// ── Enquiries ──
// What the contact form has left behind: the API keeps them newest first.
function seedEnquiries(now, packages) {
  const base = {
    packageId: null,
    packageTitle: null,
    checkIn: null,
    nights: null,
    quotedTotalMinor: null,
    currency: null,
    phone: null,
    subject: null,
    message: null,
    sourceUrl: null,
    handledById: null,
  };
  const at = (ms) => new Date(now - ms).toISOString();
  return [
    {
      ...base,
      id: "enq-3",
      reference: `ENQ-${new Date(now).getFullYear()}-0003`,
      type: "General",
      status: "New",
      name: "Sam Roe",
      email: "sam.roe@example.test",
      subject: "Group booking",
      message: "Ten of us are travelling in June and would like a quote.",
      consentAt: at(2 * HOUR),
      createdAt: at(2 * HOUR),
      updatedAt: at(2 * HOUR),
    },
    {
      ...base,
      id: "enq-2",
      reference: `ENQ-${new Date(now).getFullYear()}-0002`,
      type: "Package",
      status: "Contacted",
      packageId: packages.find((p) => p.title === "Sala Mara Escape")?.id ?? null,
      packageTitle: "Sala Mara Escape",
      checkIn: "2027-01-12",
      nights: 2,
      quotedTotalMinor: 747200,
      currency: "USD",
      name: "Jane Doe",
      email: "jane.doe@example.test",
      phone: "+254700000000",
      message: "Two adults and two children.",
      handledById: "u2",
      consentAt: at(DAY),
      createdAt: at(DAY),
      updatedAt: at(5 * HOUR),
    },
    {
      ...base,
      id: "enq-1",
      reference: `ENQ-${new Date(now).getFullYear()}-0001`,
      type: "Career",
      status: "Closed",
      name: "Amara Nwosu",
      email: "amara.nwosu@example.test",
      subject: "Operations role",
      message: "Applying for the operations coordinator role.",
      handledById: "u1",
      consentAt: at(6 * DAY),
      createdAt: at(6 * DAY),
      updatedAt: at(4 * DAY),
    },
  ];
}

/** What kind of listing an enquiry is about, from its package; null for a general message. */
const enquiryKind = (packageTitle) =>
  packageTitle
    ? (db.packages.find((p) => p.title === packageTitle)?.productType ??
      PRODUCTS.find((x) => x.detail.title === packageTitle)?.detail.productType ??
      "HolidayPackage")
    : null;

const enquiryItem = ({
  id,
  reference,
  type,
  status,
  packageTitle,
  subject,
  checkIn,
  nights,
  quotedTotalMinor,
  currency,
  name,
  email,
  createdAt,
}) => ({
  productType: enquiryKind(packageTitle),
  id,
  reference,
  type,
  status,
  packageTitle,
  subject,
  checkIn,
  nights,
  quotedTotalMinor,
  currency,
  name,
  email,
  createdAt,
});

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** POST /enquiries, following arlink28-api's rules (no rate limit: every test would share one address). */
function createEnquiry(res, body) {
  const errors = {};
  const type = body.type ?? "General";
  if (!body.name?.trim()) errors.Name = ["'Name' must not be empty."];
  if (!body.email?.trim()) errors.Email = ["'Email' must not be empty."];
  else if (!EMAIL_SHAPE.test(body.email)) errors.Email = ["'Email' is not a valid email address."];
  if (body.consent !== true) errors.Consent = ["Please agree to the privacy policy so we can contact you."];
  if (type === "Package" && !body.slug) errors.Slug = ["'Slug' must not be empty."];
  if (type !== "Package" && !body.subject?.trim()) errors.Subject = ["'Subject' must not be empty."];
  if (type !== "Package" && !body.message?.trim()) errors.Message = ["'Message' must not be empty."];
  if (Object.keys(errors).length > 0) {
    return problem(res, 400, undefined, {
      title: "One or more validation errors occurred.",
      code: "VALIDATION_FAILED",
      errors,
    });
  }

  const year = new Date().getFullYear();
  const reference = `ENQ-${year}-${String(db.enquiries.length + 1).padStart(4, "0")}`;
  if (body.website) return send(res, 201, { reference }); // the honeypot: same answer, nothing saved

  let detail = null;
  if (type === "Package") {
    detail = CATALOGUE.details[body.slug] ?? PRODUCTS.find((x) => x.detail.slug === body.slug)?.detail;
    if (!detail) return problem(res, 400, `Package '${body.slug}' is not available for enquiries.`);
  }
  const now = new Date().toISOString();
  db.enquiries.unshift({
    id: `enq-${randomUUID()}`,
    reference,
    type,
    status: "New",
    packageId: detail ? `pkg-${detail.slug}` : null,
    packageTitle: detail?.title ?? null,
    checkIn: body.checkIn ?? null,
    nights: body.nights ?? null,
    quotedTotalMinor: null,
    currency: null,
    name: body.name.trim(),
    email: body.email.trim(),
    phone: body.phone?.trim() || null,
    subject: body.subject?.trim() || null,
    message: body.message?.trim() || null,
    consentAt: now,
    sourceUrl: body.sourceUrl ?? null,
    handledById: null,
    createdAt: now,
    updatedAt: now,
  });
  return send(res, 201, { reference });
}
let db = seed();

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");

function issue(user) {
  const expiresAt = new Date(Date.now() + 8 * HOUR).toISOString();
  const payload = {
    nameid: user.id,
    unique_name: user.username,
    role: user.role,
    exp: Math.floor(Date.parse(expiresAt) / 1000),
  };
  const accessToken = `${b64({ alg: "HS256", typ: "JWT" })}.${b64(payload)}.mock-${user.id}-${Date.now()}`;
  db.tokens.set(accessToken, user.id);
  return { accessToken, role: user.role, username: user.username, expiresAt };
}

// ── Destination profiles (public): the catalogue's places plus the profiles in data/destinations.json.
// Drafts are in the data on purpose, to prove they never leak. ──
function destinationRecords() {
  const base = CATALOGUE.destinations.map((d) => ({ published: true, attractions: [], ...d, ...(DEST_DATA.overrides[d.slug] ?? {}) }));
  return [...base, ...DEST_DATA.profiles.filter((p) => !base.some((b) => b.slug === p.slug))];
}
const destinationRow = (r, parentSlug = r.parentSlug) => ({
  id: r.id, slug: r.slug, name: r.name, country: r.country, kind: r.kind ?? "Place", parentSlug: parentSlug ?? null,
  tagline: r.tagline ?? null, summary: r.summary ?? null, heroPath: r.heroPath ?? null, heroAlt: r.heroAlt ?? null, heroCredit: r.heroCredit ?? null,
});
function destinationList(params) {
  let rows = destinationRecords().filter((r) => r.published);
  if (params.get("country")) rows = rows.filter((r) => r.country === params.get("country").toUpperCase());
  if (params.get("kind")) rows = rows.filter((r) => (r.kind ?? "Place").toLowerCase() === params.get("kind").toLowerCase());
  return rows.map((r) => destinationRow(r));
}
function destinationDetail(slug) {
  const all = destinationRecords();
  const r = all.find((x) => x.slug === slug && x.published);
  if (!r) return null;
  const parent = all.find((x) => x.slug === r.parentSlug && x.published);
  const places = all.filter((x) => x.parentSlug === slug && x.published);
  const slugs = [slug, ...places.map((x) => x.slug)];
  return {
    ...destinationRow(r), description: r.description ?? null, bestTimeToVisit: r.bestTimeToVisit ?? null,
    latitude: null, longitude: null,
    parent: parent ? destinationRow(parent) : undefined,
    places: places.map((x) => destinationRow(x)),
    attractions: r.attractions ?? [],
    packageCount: CATALOGUE.packages.filter((p) => slugs.includes(p.destination.slug)).length,
  };
}

function send(res, status, body) {
  if (body === undefined) {
    res.writeHead(status);
    return res.end();
  }
  const problem = status >= 400;
  res.writeHead(status, { "Content-Type": problem ? "application/problem+json" : "application/json" });
  res.end(JSON.stringify(body));
}

const TITLES = {
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  422: "Unprocessable Entity",
};
const CODES = { 400: "BAD_REQUEST", 401: "UNAUTHENTICATED", 403: "FORBIDDEN", 404: "NOT_FOUND", 422: "UNPROCESSABLE" };
const problem = (res, status, detail, extra = {}) =>
  send(res, status, {
    title: TITLES[status],
    status,
    ...(detail && { detail }),
    code: CODES[status],
    traceId: "mock",
    ...extra,
  });

const quoteError = (res, code, detail) => problem(res, 422, detail, { code });

/** GET /packages/{slug}/quote, following arlink28-api's PricingEngine (see header note on seasons). */
function quote(res, pkg, params) {
  const checkIn = params.get("checkIn") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checkIn)) {
    return problem(res, 400, undefined, {
      title: "One or more validation errors occurred.",
      code: "VALIDATION_FAILED",
      errors: { CheckIn: ["The CheckIn field is required."] },
    });
  }
  const nights = params.get("nights") ? Number(params.get("nights")) : pkg.nights;
  const currency = params.get("currency") ?? "USD";
  if (nights < pkg.minNights) return quoteError(res, "BELOW_MIN_NIGHTS", `Minimum stay is ${pkg.minNights} nights.`);
  if (nights > pkg.nights && !pkg.rates.some((r) => r.extraNightPriceMinor != null)) {
    return quoteError(res, "EXTRA_NIGHTS_NOT_SOLD", "Extra nights are not available for this package.");
  }
  const md = checkIn.slice(5);
  const rate = pkg.rates.find((r) =>
    (CATALOGUE.seasons[r.seasonSlug] ?? []).some(([start, end]) => start <= md && md <= end),
  );
  if (!rate) return quoteError(res, "NO_RATE_FOR_DATE", "No rate is defined for the requested check-in date.");
  if (rate.currency !== currency)
    return quoteError(res, "CURRENCY_NOT_AVAILABLE", `This package is not priced in ${currency}.`);

  const lines = [{ label: "Base package", amountMinor: rate.priceMinor, currency }];
  const extra = nights - pkg.nights;
  if (extra > 0)
    lines.push({ label: `${extra} extra night(s)`, amountMinor: rate.extraNightPriceMinor * extra, currency });
  const people = pkg.adults + pkg.children;
  for (const part of (params.get("addOns") ?? "").split(",").filter(Boolean)) {
    const [id, qty] = part.split(":");
    const addOn = pkg.addOns.find((a) => a.id === id);
    if (!addOn) return quoteError(res, "UNKNOWN_ADD_ON", `Add-on ${id} not found.`);
    const units = addOn.unit === "PerStay" ? 1 : addOn.unit === "PerPerson" ? people : nights;
    const quantity = units * Number(qty);
    lines.push({
      label: `${addOn.name} x${quantity}`,
      amountMinor: addOn.priceMinor * quantity,
      currency: addOn.currency,
    });
  }
  const totalMinor = lines.reduce((sum, l) => sum + l.amountMinor, 0);
  return send(res, 200, { totalMinor, currency, baseMinor: rate.priceMinor, nights, lines });
}

function strongPassword(p) {
  if (typeof p !== "string" || p.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(p)) return "Password must contain at least one uppercase letter.";
  if (!/[a-z]/.test(p)) return "Password must contain at least one lowercase letter.";
  if (!/[0-9]/.test(p)) return "Password must contain at least one digit.";
  return null;
}

async function readJson(req) {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return null;
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://mock");
  const path = url.pathname;
  const method = req.method;

  if (method === "POST" && path === "/__reset") {
    db = seed();
    return send(res, 204);
  }

  if (method === "GET" && path.startsWith("/media/")) {
    const file = db.files.get(path);
    if (!file) return problem(res, 404);
    res.writeHead(200, { "Content-Type": file.type });
    return res.end(file.data);
  }

  const isUpload = method === "POST" && /^\/api\/v1\/admin\/packages\/[^/]+\/media$/.test(path);
  const raw = isUpload ? await readRaw(req) : null;
  const body = method === "GET" || isUpload ? {} : await readJson(req);
  if (body === null)
    return problem(res, 400, undefined, {
      errors: { "": ["The request body isn't valid JSON."] },
      code: "VALIDATION_FAILED",
    });

  const auth = req.headers.authorization?.replace(/^Bearer /, "");
  const me = auth && db.tokens.has(auth) ? db.users.find((u) => u.id === db.tokens.get(auth)) : null;
  const requireUser = () => (me && me.isActive ? me : null);

  // ── Auth ──
  if (method === "POST" && path === "/api/v1/auth/login") {
    if (!body.username || !body.password) {
      return problem(res, 400, undefined, {
        title: "One or more validation errors occurred.",
        code: "VALIDATION_FAILED",
        errors: { Username: ["'Username' must not be empty."] },
      });
    }
    const user = db.users.find((u) => u.username === body.username);
    if (!user || !user.isActive || db.passwords[user.username] !== body.password) {
      return problem(res, 401, "Invalid username or password.");
    }
    user.lastLoginAt = new Date().toISOString();
    return send(res, 200, issue(user));
  }
  if (method === "GET" && path === "/api/v1/auth/me") {
    const u = requireUser();
    if (!u) return problem(res, 401);
    const exp = JSON.parse(Buffer.from(auth.split(".")[1], "base64url").toString()).exp;
    return send(res, 200, {
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      expiresAt: new Date(exp * 1000).toISOString(),
    });
  }
  if (method === "POST" && path === "/api/v1/auth/logout") {
    if (!requireUser()) return problem(res, 401);
    db.tokens.delete(auth);
    return send(res, 204);
  }
  if (method === "PATCH" && path === "/api/v1/auth/change-password") {
    const u = requireUser();
    if (!u) return problem(res, 401);
    if (db.passwords[u.username] !== body.currentPassword) return problem(res, 400, "Current password is incorrect.");
    const weak = strongPassword(body.newPassword);
    if (weak)
      return problem(res, 400, undefined, {
        title: "One or more validation errors occurred.",
        code: "VALIDATION_FAILED",
        errors: { NewPassword: [weak] },
      });
    db.passwords[u.username] = body.newPassword;
    return send(res, 204);
  }
  if (method === "POST" && path === "/api/v1/auth/reset-password/request") return send(res, 204);
  if (method === "POST" && path === "/api/v1/auth/reset-password/confirm") {
    if (!db.resets.has(body.token)) return problem(res, 400, "This reset link is invalid or has expired.");
    const weak = strongPassword(body.newPassword);
    if (weak)
      return problem(res, 400, undefined, {
        title: "One or more validation errors occurred.",
        code: "VALIDATION_FAILED",
        errors: { NewPassword: [weak] },
      });
    db.resets.delete(body.token);
    return send(res, 204);
  }

  // ── Catalogue (public) ──
  if (method === "GET" && path === "/api/v1/destinations") return send(res, 200, destinationList(url.searchParams));
  if (method === "GET" && path.startsWith("/api/v1/destinations/")) {
    const found = destinationDetail(decodeURIComponent(path.slice("/api/v1/destinations/".length)));
    return found ? send(res, 200, found) : send(res, 404, { type: "about:blank", title: "Not Found", status: 404, code: "NOT_FOUND" });
  }
  if (method === "GET" && path === "/api/v1/packages") {
    const q = Object.fromEntries([...url.searchParams].map(([k, v]) => [k.toLowerCase(), v]));
    // Holidays unless another kind, or "all", is asked for: the API's rule.
    const kind = q.type ?? "HolidayPackage";
    const products = PRODUCTS.map((x) => x.card);
    let items =
      kind === "all"
        ? [...CATALOGUE.packages, ...products]
        : kind === "HolidayPackage"
          ? CATALOGUE.packages
          : products.filter((c) => c.productType === kind);
    if (q.destination) {
      const inside = destinationRecords().filter((d) => d.parentSlug === q.destination).map((d) => d.slug);
      items = items.filter((p) => p.destination.slug === q.destination || inside.includes(p.destination.slug));
    }
    if (q.category) items = items.filter((p) => p.category === q.category);
    if (q.partner)
      items = items.filter((p) => CATALOGUE.details[p.slug]?.stays.some((st) => st.propertySlug === q.partner));
    if (q.adults) items = items.filter((p) => p.adults >= Number(q.adults));
    if (q.q) {
      const term = q.q.toLowerCase();
      items = items.filter((p) => `${p.title} ${p.subtitle ?? ""} ${p.summary ?? ""}`.toLowerCase().includes(term));
    }
    const limit = Math.min(100, Math.max(1, Number(q.limit ?? 20)));

    if (q.page) {
      const price = (p) => p.fromPriceMinor ?? Infinity;
      const order =
        {
          price: (a, b) => price(a) - price(b),
          "-price": (a, b) => (b.fromPriceMinor ?? -Infinity) - (a.fromPriceMinor ?? -Infinity) || 0,
          nights: (a, b) => a.nights - b.nights,
        }[q.sort] ?? ((a, b) => Number(b.featured) - Number(a.featured));
      const sorted = items.slice().sort(order);
      const page = Math.max(1, Number(q.page));
      const pageItems = sorted.slice((page - 1) * limit, page * limit).map(publicCard);
      return send(res, 200, { items: pageItems, nextCursor: null, total: sorted.length, page, pageSize: limit });
    }

    const offset = q.cursor ? Number(Buffer.from(q.cursor, "base64url").toString()) : 0;
    const page = items.slice(offset, offset + limit).map(publicCard);
    const next = offset + limit < items.length ? Buffer.from(String(offset + limit)).toString("base64url") : null;
    return send(res, 200, { items: page, nextCursor: next });
  }
  const pkgMatch = path.match(/^\/api\/v1\/packages\/([^/]+)(\/quote)?$/);
  if (method === "GET" && pkgMatch) {
    const slug = decodeURIComponent(pkgMatch[1]);
    const product = PRODUCTS.find((x) => x.detail.slug === slug);
    if (product && !pkgMatch[2]) return send(res, 200, product.detail);
    const detail = CATALOGUE.details[slug];
    if (!detail) return problem(res, 404, `Package '${pkgMatch[1]}' not found.`);
    if (!pkgMatch[2]) return send(res, 200, publicDetail(detail));
    return quote(res, detail, url.searchParams);
  }

  // ── Enquiries ──
  if (method === "POST" && path === "/api/v1/enquiries") return createEnquiry(res, body);
  const enquiryMatch = path.match(/^\/api\/v1\/admin\/enquiries(?:\/([^/]+))?$/);
  if (enquiryMatch) {
    if (!requireUser()) return problem(res, 401);
    const target = enquiryMatch[1] && db.enquiries.find((e) => e.id === enquiryMatch[1]);
    if (method === "GET" && !enquiryMatch[1]) {
      const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
      const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") ?? 25)));
      const status = url.searchParams.get("status");
      const kind = url.searchParams.get("type")?.toLowerCase();
      const ofKind = kind
        ? db.enquiries.filter((e) => enquiryKind(e.packageTitle)?.toLowerCase() === kind)
        : db.enquiries;
      const count = (s) => ofKind.filter((e) => e.status === s).length;
      const matching = status ? ofKind.filter((e) => e.status.toLowerCase() === status.toLowerCase()) : ofKind;
      return send(res, 200, {
        items: matching.slice((page - 1) * pageSize, page * pageSize).map(enquiryItem),
        total: matching.length,
        page,
        pageSize,
        counts: { all: ofKind.length, new: count("New"), contacted: count("Contacted"), closed: count("Closed") },
      });
    }
    if (enquiryMatch[1] && !target) return problem(res, 404, "Enquiry not found.");
    if (method === "GET") return send(res, 200, { ...target, productType: enquiryKind(target.packageTitle) });
    if (method === "PATCH") {
      if (!["New", "Contacted", "Closed"].includes(body.status)) {
        return problem(res, 400, undefined, {
          title: "One or more validation errors occurred.",
          code: "VALIDATION_FAILED",
          errors: { Status: ["'Status' has a range of values which does not include the one given."] },
        });
      }
      if (target.status !== body.status) {
        target.status = body.status;
        target.handledById = body.status === "New" ? null : me.id;
        target.updatedAt = new Date().toISOString();
      }
      return send(res, 200, target);
    }
  }

  // ── Admin packages ──
  if (method === "GET" && path === "/api/v1/admin/reference") {
    return requireUser() ? send(res, 200, REFERENCE) : problem(res, 401);
  }
  const adminMatch = path.match(
    /^\/api\/v1\/admin\/packages(?:\/([^/]+))?(?:\/(media|stays|features|rates|add-ons|publish|unpublish|archive)(?:\/([^/]+))?)?$/,
  );
  if (adminMatch) {
    if (!requireUser()) return problem(res, 401);
    const [, id, part, mediaKey] = adminMatch;
    const isMedia = part === "media";
    const validation = (errors) =>
      problem(res, 400, undefined, {
        title: "One or more validation errors occurred.",
        code: "VALIDATION_FAILED",
        errors,
      });

    if (!id) {
      if (method === "GET") {
        const q = url.searchParams;
        const term = q.get("search")?.trim().toLowerCase();
        const destination = q.get("destination");
        const category = q.get("category")?.toUpperCase();
        const type = q.get("type");
        const matching = db.packages.filter(
          (p) =>
            (!term || p.title.toLowerCase().includes(term) || p.slug.includes(term)) &&
            (!type || p.productType === type) &&
            (!destination || p.destination.slug === destination) &&
            (!category || p.category === category),
        );
        const inStatus = (name) => matching.filter((p) => p.status === name).length;
        const counts = {
          all: matching.length,
          draft: inStatus("Draft"),
          published: inStatus("Published"),
          archived: inStatus("Archived"),
        };
        const status = q.get("status")?.toLowerCase();
        const filtered = (status ? matching.filter((p) => p.status.toLowerCase() === status) : matching)
          .slice()
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.title.localeCompare(b.title));
        const page = Math.max(1, Number(q.get("page")) || 1);
        const pageSize = Math.min(100, Math.max(1, Number(q.get("pageSize")) || 25));
        const items = filtered.slice((page - 1) * pageSize, page * pageSize).map(adminSummary);
        return send(res, 200, { items, total: filtered.length, page, pageSize, counts });
      }
      if (method === "POST") {
        const errors = {};
        const productType = body.productType ?? "HolidayPackage";
        const holiday = productType === "HolidayPackage";
        if (!body.title?.trim()) errors.Title = ["'Title' must not be empty."];
        if (holiday && !(body.nights >= 1 && body.nights <= 60)) errors.Nights = ["'Nights' must be between 1 and 60."];
        if (Object.keys(errors).length) return validation(errors);
        let details = null;
        if (!holiday) {
          const result = normalizeDetails(productType, body.details);
          if (result.error) return problem(res, 400, result.error);
          details = result.value;
        }
        const destination = CATALOGUE.destinations.find((d) => d.id === body.destinationId);
        if (!destination) return problem(res, 400, "That destination doesn't exist.");
        let slug = slugify(body.title);
        for (let n = 2; db.packages.some((p) => p.slug === slug); n++) slug = `${slugify(body.title)}-${n}`;
        const now = new Date().toISOString();
        const created = {
          id: randomUUID(),
          slug,
          status: "Draft",
          title: body.title.trim(),
          subtitle: body.subtitle?.trim() || null,
          summary: body.summary?.trim() || null,
          description: null,
          productType,
          details,
          category: holiday ? String(body.category).toUpperCase() : productType.toUpperCase(),
          destination,
          nights: body.nights,
          minNights: body.nights,
          adults: body.adults,
          children: body.children,
          pricingBasis: body.pricingBasis ?? "PerParty",
          baseCurrency: body.baseCurrency ?? "USD",
          fromPriceMinor: !holiday && body.fromPriceMinor ? body.fromPriceMinor : null,
          featured: false,
          seoTitle: null,
          seoDescription: null,
          publishedAt: null,
          createdAt: now,
          updatedAt: now,
          stays: [],
          features: [],
          rates: [],
          addOns: [],
          media: [],
        };
        db.packages.push(created);
        res.setHeader("Location", `/api/v1/admin/packages/${created.id}`);
        return send(res, 201, created);
      }
    } else {
      const pkg = db.packages.find((p) => p.id === id);
      if (!pkg) return problem(res, 404, "Package not found.");
      const sorted = () => [...pkg.media].sort((a, b) => a.sortKey - b.sortKey);

      if (part && part !== "media") {
        const list = Array.isArray(body) ? body : [];
        const bad = (detail) => problem(res, 400, detail);
        const touch = () => {
          pkg.updatedAt = new Date().toISOString();
          if (pkg.productType === "HolidayPackage") pkg.fromPriceMinor = fromPrice(pkg);
          return send(res, 200, pkg);
        };
        if (["stays", "rates", "add-ons"].includes(part) && pkg.productType !== "HolidayPackage")
          return bad("Only holiday packages have stays, rates and add-ons.");

        if (part === "publish" && method === "POST") {
          const missing = publishChecklist(pkg);
          if (missing.length)
            return problem(res, 422, "This package is not ready to publish.", { code: "PUBLISH_BLOCKED", missing });
          pkg.status = "Published";
          pkg.publishedAt ??= new Date().toISOString();
          return touch();
        }
        if (part === "unpublish" && method === "POST") {
          pkg.status = "Draft";
          return touch();
        }
        if (part === "archive" && method === "POST") {
          pkg.status = "Archived";
          return touch();
        }

        if (part === "stays" && method === "PUT") {
          for (const [i, s] of list.entries()) {
            const property = REFERENCE.properties.find((p) => p.id === s.propertyId);
            if (!property) return bad(`Stay ${i + 1}: choose a property.`);
            if (!(s.nights >= 1 && s.nights <= 60)) return bad(`Stay ${i + 1}: nights must be between 1 and 60.`);
          }
          pkg.stays = list.map((s, i) => {
            const property = REFERENCE.properties.find((p) => p.id === s.propertyId);
            return {
              id: randomUUID(),
              propertyId: s.propertyId,
              propertyName: property.name,
              destinationName: property.destinationName,
              nights: s.nights,
              roomType: s.roomType?.trim() || null,
              sortOrder: i,
            };
          });
          return touch();
        }

        if (part === "features" && method === "PUT") {
          for (const [i, f] of list.entries()) {
            if (!f.featureId && !f.label?.trim())
              return bad(`Line ${i + 1}: write the line, or choose one from the list.`);
            if (f.featureId && !REFERENCE.features.some((x) => x.id === f.featureId))
              return bad(`Line ${i + 1}: that feature does not exist.`);
          }
          pkg.features = list.map((f, i) => {
            const shared = REFERENCE.features.find((x) => x.id === f.featureId);
            return {
              id: randomUUID(),
              section: f.section,
              featureId: f.featureId ?? null,
              label: shared ? shared.label : f.label.trim(),
              icon: shared?.icon ?? null,
              footnote: f.footnote?.trim() || null,
              sortOrder: i,
            };
          });
          return touch();
        }

        if (part === "rates" && method === "PUT") {
          const rates = [];
          for (const [i, r] of list.entries()) {
            const season = REFERENCE.seasons.find((s) => s.id === r.seasonId);
            const currency = String(r.currency ?? "")
              .trim()
              .toUpperCase();
            if (!season) return bad(`Rate ${i + 1}: choose a season.`);
            if (currency.length !== 3) return bad(`Rate ${i + 1}: the currency needs three letters, like USD.`);
            if (!(r.priceMinor > 0)) return bad(`Rate ${i + 1}: enter a price above zero.`);
            rates.push({ season, currency, priceMinor: r.priceMinor, extra: r.extraNightPriceMinor ?? null });
          }
          for (const [i, a] of rates.entries()) {
            for (const b of rates.slice(i + 1)) {
              if (a.currency !== b.currency) continue;
              if (a.season.id === b.season.id) return bad(`${a.season.name} is listed twice in ${a.currency}.`);
              if (a.season.ranges.some((x) => b.season.ranges.some((y) => x.start <= y.end && y.start <= x.end)))
                return bad(
                  `${a.season.name} and ${b.season.name} overlap, so a date could match two ${a.currency} prices.`,
                );
            }
          }
          pkg.rates = rates.map((r) => ({
            id: randomUUID(),
            seasonId: r.season.id,
            seasonName: r.season.name,
            currency: r.currency,
            priceMinor: r.priceMinor,
            extraNightPriceMinor: r.extra,
          }));
          return touch();
        }

        if (part === "add-ons" && method === "PUT") {
          for (const [i, a] of list.entries()) {
            if (!a.name?.trim()) return bad(`Add-on ${i + 1}: give it a name.`);
            if (String(a.currency ?? "").trim().length !== 3)
              return bad(`Add-on ${i + 1}: the currency needs three letters, like USD.`);
            if (!(a.priceMinor >= 0)) return bad(`Add-on ${i + 1}: the price cannot be negative.`);
            if (a.id && !pkg.addOns.some((x) => x.id === a.id))
              return bad(`Add-on ${i + 1}: it does not belong to this package.`);
          }
          pkg.addOns = list.map((a, i) => ({
            id: a.id ?? randomUUID(),
            name: a.name.trim(),
            description: a.description?.trim() || null,
            unit: a.unit,
            currency: String(a.currency).trim().toUpperCase(),
            priceMinor: a.priceMinor,
            sortOrder: i,
          }));
          return touch();
        }
      }

      if (!isMedia) {
        if (method === "GET") return send(res, 200, pkg);
        if (method === "PATCH") {
          const errors = {};
          if (body.title !== undefined && !body.title.trim()) errors.Title = ["'Title' must not be empty."];
          if (Object.keys(errors).length) return validation(errors);
          for (const key of [
            "title",
            "subtitle",
            "summary",
            "description",
            "category",
            "nights",
            "minNights",
            "adults",
            "children",
            "pricingBasis",
            "baseCurrency",
            "featured",
            "seoTitle",
            "seoDescription",
          ]) {
            if (body[key] === undefined) continue;
            pkg[key] =
              typeof body[key] === "string" ? body[key].trim() || (key === "title" ? pkg[key] : null) : body[key];
          }
          if (body.category) pkg.category = body.category.toUpperCase();
          if (body.baseCurrency) pkg.baseCurrency = body.baseCurrency.toUpperCase();
          if (body.nights !== undefined && body.minNights === undefined)
            pkg.minNights = Math.min(pkg.minNights, pkg.nights);
          if (pkg.minNights > pkg.nights)
            return problem(res, 400, "The minimum stay can't be longer than the package's nights.");
          if (pkg.productType === "HolidayPackage") {
            if (body.fromPriceMinor !== undefined)
              return problem(res, 400, "A holiday package's from-price comes from its season rates.");
            if (body.details !== undefined)
              return problem(
                res,
                400,
                "Holiday packages don't have a details object; edit their stays and rates instead.",
              );
            pkg.fromPriceMinor = fromPrice(pkg);
          } else {
            if (body.details !== undefined) {
              const result = normalizeDetails(pkg.productType, body.details);
              if (result.error) return problem(res, 400, result.error);
              pkg.details = result.value;
            }
            if (body.fromPriceMinor !== undefined) pkg.fromPriceMinor = body.fromPriceMinor || null;
          }
          if (body.destinationId) {
            const destination = CATALOGUE.destinations.find((d) => d.id === body.destinationId);
            if (!destination) return problem(res, 400, "That destination doesn't exist.");
            pkg.destination = destination;
          }
          pkg.updatedAt = new Date().toISOString();
          return send(res, 200, pkg);
        }
      } else if (!mediaKey && method === "POST") {
        const files = parseMultipart(raw, req.headers["content-type"]);
        if (files.length === 0) return problem(res, 400, "Choose at least one photo.");
        if (files.length > 20) return problem(res, 400, "Upload at most 20 photos at a time.");
        for (const f of files) {
          if (f.data.length > MAX_PHOTO_BYTES) return problem(res, 400, `${f.filename} is larger than 10 MB.`);
          if (!sniff(f.data)) return problem(res, 400, `${f.filename} isn't a JPEG, PNG or WebP photo.`);
        }
        let sortKey = pkg.media.length ? Math.max(...pkg.media.map((m) => m.sortKey)) + 1 : 0;
        let hasHero = pkg.media.some((m) => m.role === "Hero");
        const added = files.map((f) => {
          const type = sniff(f.data);
          const path = `/media/packages/${pkg.id.replaceAll("-", "")}/${randomUUID().replaceAll("-", "")}.${type.split("/")[1].replace("jpeg", "jpg")}`;
          db.files.set(path, { type, data: f.data });
          const item = {
            id: randomUUID(),
            role: hasHero ? "Gallery" : "Hero",
            path,
            alt: f.filename.replace(/\.[^.]+$/, "").replace(/[-_.]+/g, " "),
            caption: null,
            width: null,
            height: null,
            videoProvider: null,
            videoId: null,
            sortKey: sortKey++,
          };
          hasHero = true;
          return item;
        });
        pkg.media.push(...added);
        pkg.updatedAt = new Date().toISOString();
        return send(res, 201, added);
      } else if (mediaKey === "order" && method === "PUT") {
        const ids = body.ids ?? [];
        if (
          new Set(ids).size !== ids.length ||
          ids.length !== pkg.media.length ||
          !pkg.media.every((m) => ids.includes(m.id))
        )
          return problem(res, 400, "Send every photo of this package exactly once.");
        ids.forEach((mid, i) => (pkg.media.find((m) => m.id === mid).sortKey = i));
        return send(res, 200, sorted());
      } else if (mediaKey && method === "PATCH") {
        const item = pkg.media.find((m) => m.id === mediaKey);
        if (!item) return problem(res, 404, "Photo not found.");
        if (body.role === "Hero") pkg.media.forEach((m) => m.role === "Hero" && (m.role = "Gallery"));
        if (body.role) item.role = body.role;
        if (body.alt !== undefined) item.alt = body.alt?.trim() || null;
        if (body.caption !== undefined) item.caption = body.caption?.trim() || null;
        return send(res, 200, item);
      } else if (mediaKey && method === "DELETE") {
        const item = pkg.media.find((m) => m.id === mediaKey);
        if (!item) return problem(res, 404, "Photo not found.");
        pkg.media = pkg.media.filter((m) => m.id !== mediaKey);
        db.files.delete(item.path);
        if (item.role === "Hero") {
          const next = sorted().find((m) => m.role === "Gallery" && !m.videoProvider);
          if (next) next.role = "Hero";
        }
        return send(res, 204);
      }
    }
  }

  // ── Users ──
  if (method === "POST" && path === "/api/v1/users/invite/accept") {
    const invite = db.invites.get(body.token);
    if (!invite) return problem(res, 400, "This invite is invalid or has expired.");
    if (!/^[a-zA-Z0-9_]{3,50}$/.test(body.username ?? "")) {
      return problem(res, 400, undefined, {
        title: "One or more validation errors occurred.",
        code: "VALIDATION_FAILED",
        errors: { Username: ["Username may only contain letters, digits, and underscores."] },
      });
    }
    const weak = strongPassword(body.password);
    if (weak)
      return problem(res, 400, undefined, {
        title: "One or more validation errors occurred.",
        code: "VALIDATION_FAILED",
        errors: { Password: [weak] },
      });
    const user = {
      id: `u${db.users.length + 1}`,
      username: body.username,
      email: invite.email,
      role: invite.role,
      isActive: true,
      lastLoginAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    db.passwords[user.username] = body.password;
    db.invites.delete(body.token);
    return send(res, 200, issue(user));
  }
  if (path.startsWith("/api/v1/users")) {
    const u = requireUser();
    if (!u) return problem(res, 401);
    if (u.role !== "SuperAdmin") return problem(res, 403);

    if (method === "GET" && path === "/api/v1/users") return send(res, 200, db.users);
    if (method === "POST" && path === "/api/v1/users/invite") {
      if (db.users.some((x) => x.email === body.email))
        return problem(res, 400, "A staff member with this email already exists.");
      db.invites.set(`invite-${Date.now()}`, { email: body.email, role: body.role });
      return send(res, 204);
    }
    const m = path.match(/^\/api\/v1\/users\/([^/]+)\/(role|deactivate)$/);
    const target = m && db.users.find((x) => x.id === m[1]);
    if (method === "PATCH" && m && !target) return problem(res, 404, "User not found.");
    if (method === "PATCH" && m?.[2] === "role") {
      target.role = body.role;
      return send(res, 204);
    }
    if (method === "PATCH" && m?.[2] === "deactivate") {
      if (target.id === u.id) return problem(res, 400, "You can't deactivate your own account.");
      target.isActive = false;
      return send(res, 204);
    }
  }

  return problem(res, 404);
});

server.listen(PORT, () => console.log(`mock arlink28-api on http://localhost:${PORT}`));
