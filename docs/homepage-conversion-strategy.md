# ARLink28 homepage — conversion audit and redesign strategy

Status: **proposal, awaiting approval. No application code has been changed.**
Date: 2026-10-02. Branch audited: `feature/admin-packages` (homepage = `apps/web/app/(web)/page.tsx`).

## 0. How this was audited, and what could not be verified

| Source                                                                                                 | Result                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Homepage source, `BookingWidget`, `ClientEffects`, `Header`, `Footer`, `globals.css`, `docs/design.md` | Read in full                                                                                                                                                                                                                                                                                                                                        |
| Homepage rendered locally (`next dev`, port 3100), DOM/network/image metrics read via script           | Done                                                                                                                                                                                                                                                                                                                                                |
| Live `https://arlink28.com/`                                                                           | **Not inspected.** This machine's TLS is intercepted by a Fortinet firewall (certificate issuer is a FortiGate, not a public CA), so fetch tools and the browser fail on every HTTPS site. That is a local-network fact, not a defect of arlink28.com. Local code is the same source. Deployed-only behaviour (CDN, caching, real LCP) is untested. |
| Screenshots                                                                                            | Blocked by the browser tool's per-domain permission for localhost. **Nothing below is a visual judgement of the rendered page**; visual claims come from CSS and markup.                                                                                                                                                                            |
| Competitors (Travelstart, Trip.com, Booking.com)                                                       | Fetch returned a page title only (client-rendered). Competitor sections below are **pattern knowledge, not live observation**, and must be re-verified on a clean network before design is locked.                                                                                                                                                  |
| Real-user data (analytics, Search Console, heatmaps)                                                   | None exists. There is no analytics in the codebase. All "problems" are inferred, not measured.                                                                                                                                                                                                                                                      |

## 1. Executive summary

The homepage is a faithful port of an older static site. It looks like a dark airline brochure, but the business is a travel agency and enquiry operation with flights, hotels, visas and curated packages. The page promises one thing, the product does another, and several of its controls do nothing.

Three findings outrank everything else:

1. **The hero search does nothing and the newsletter discards emails.** `ClientEffects.tsx` intercepts every `form.booking-form` and `form.newsletter-form`, logs "no backend wired up yet", and resets the form. The flight form's `action` is the dead static-export URL `/book/flight.html`. Every visitor who fills in the hero and presses the button loses their input.
2. **Positioning is wrong.** The page title is "ARLinks - Premium African Aviation" and the description says "Africa's next great airline." ARLink28 is not presented anywhere as an airline operator. This is a trust and potentially a legal problem, not just a copy problem.
3. **The homepage ignores what you just built.** `/flights`, `/hotels`, `/visas`, `/packages` and the enquiry backend exist. The homepage still sends nearly everything to `/book/flight` and `/travel`.

Awwards note, stated plainly: Awwards scores Design, Usability, Creativity and Content (plus Developer). A site that converts and a site that wins can both be true, but only if craft is concentrated in one or two memorable moments and everything else is fast, quiet and clear. The current glass-panel, red-glow, icon-in-circle-card style is the template look the Awwards jury sees thousands of times. See section 17.

## 2. Current homepage problems

Severity: P0 broken or damaging, P1 major conversion loss, P2 important, P3 polish.

| #   | Problem                                                                                                                                                                         | Evidence                                                                                                                                    | P   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| 1   | Hero search and all four tabs submit to nowhere                                                                                                                                 | `ClientEffects.tsx:52-61`; `form-flight action="/book/flight.html"`; hotel/holiday/visa forms `action=null`; fields are unnamed `<select>`s | P0  |
| 2   | Newsletter collects and discards emails                                                                                                                                         | same handler; plus a required consent checkbox adds friction for nothing                                                                    | P0  |
| 3   | Airline positioning in `<title>` and meta                                                                                                                                       | `metadata` in `page.tsx`                                                                                                                    | P0  |
| 4   | 13.6 MB `nav.png` is the hero background                                                                                                                                        | `globals.css:226`; `public/images/nav.png` 13,602,554 bytes. Guaranteed LCP failure on African mobile networks                              | P0  |
| 5   | Destination photos ~450-650 KB each, plain `<img>`, 750-1500 px sources shown at 224x300; ~5 MB for the grid                                                                    | image metrics; no `next/image`                                                                                                              | P1  |
| 6   | Ten destination cards all link to `/book/flight` with no route, so interest is thrown away                                                                                      | `page.tsx` destinations block                                                                                                               | P1  |
| 7   | Hero is vague: "WE CONNECT EVERY JOURNEY." names no product, and the subcopy is a grammatical stumble ("Flight tickets to domestic and international flights at cheap prices.") | `page.tsx`                                                                                                                                  | P1  |
| 8   | One CTA, flight-only, while the business sells four things                                                                                                                      | hero                                                                                                                                        | P1  |
| 9   | Native `<select>` with 420 airport options, no search, no typeahead, unusable on a phone                                                                                        | DOM: 420 `option` nodes                                                                                                                     | P1  |
| 10  | No social proof anywhere: no reviews, no numbers, no partners. Real assets exist and are unused (summit and TravelExpo photos in `public/images`)                               | grep, image dir                                                                                                                             | P1  |
| 11  | Unverified claims presented as fact: "No Waiting Time", "24/7", "trusted airlines", "Direct flights... daily", "luxury hotels", fixed prices ($499, $199, $649, $9,664)         | `page.tsx`                                                                                                                                  | P1  |
| 12  | Header shows "Sign in -> /admin/login" to the public                                                                                                                            | `Header.tsx`                                                                                                                                | P1  |
| 13  | Navigation is organisation-centric (About, Connect, Team, Engagement, Opportunities) not traveller-centric; 9 items plus Sign in                                                | nav dump                                                                                                                                    | P1  |
| 14  | WhatsApp exists only in the footer; no sticky entry. Phone and WhatsApp are the highest-intent human channel in this market                                                     | footer links                                                                                                                                | P1  |
| 15  | Zanzibar card sends the visitor to an external hotel site (`blueoceanhotels.com`), leaking the lead                                                                             | `page.tsx`                                                                                                                                  | P1  |
| 16  | "Visa Assistance" card links to `#travel-insurance`; "Learn More" x6 is a weak repeated CTA                                                                                     | `page.tsx`                                                                                                                                  | P2  |
| 17  | No JSON-LD, no canonical, no `og:image`, no analytics                                                                                                                           | DOM                                                                                                                                         | P1  |
| 18  | Two render-blocking font systems: Google Fonts `@import` inside CSS, plus full Font Awesome (CDN) for ~15 icons                                                                 | `globals.css:1`, `layout.tsx`                                                                                                               | P2  |
| 19  | 6,668 px tall page with scroll-reveal on nearly every block; reveal animation delays content and hurts INP/CLS                                                                  | DOM height; `ClientEffects`                                                                                                                 | P2  |
| 20  | `IMG_5238.png` plane at 130% width, `HERO.png` 520 px source upscaled to 550                                                                                                    | markup                                                                                                                                      | P3  |
| 21  | 147 MB `public/images`, HEIC and an `.mp4` in the public folder                                                                                                                 | `du`                                                                                                                                        | P2  |

## 3. The 3-second clarity test

Judged from markup (not a rendered screenshot).

| Question                    | Can a first-time visitor answer? | Why                                                          |
| --------------------------- | -------------------------------- | ------------------------------------------------------------ |
| What is ARLink28?           | Partly                           | Tag "WITHIN AFRICA & BEYOND", but the headline is abstract   |
| What problem does it solve? | No                               | Headline is brand language; subcopy says "cheap prices" only |
| Who is it for?              | No                               | Not stated                                                   |
| What can I book?            | Mostly flights                   | Four tabs exist, but the CTA says "Book Flight"              |
| Why trust it?               | No                               | Nothing above the fold                                       |
| What next?                  | Yes, but wrong                   | "Book Flight" leads to a page, not to a quote                |

**Headline verdict.** "We connect every journey" is a brand line, not a value proposition. Keep it as a brand sign-off, not the H1.

Five messaging directions (pick one to test; do not blend):

| #   | Direction           | Example H1                                                         | Psychology                                                                               | Risk                          |
| --- | ------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- | ----------------------------- |
| A   | Expertise and human | "Travel across Africa with people who know the routes."            | Reduces fear of a complicated, expensive market; points at the human advantage over apps | Needs real expertise proof    |
| B   | Whole-trip          | "Flights, hotels and visas. One team, one booking."                | Removes the stitch-together burden                                                       | Reads like a generic agency   |
| C   | Route-specific      | "Lagos to Nairobi, Accra to London. Fly it without the guesswork." | Specificity signals competence                                                           | Narrow; needs live route data |
| D   | Friction-removal    | "Africa's travel, handled."                                        | Short, memorable, Awwards-friendly                                                       | Vague without a sub-line      |
| E   | Outcome             | "From your first idea to your arrival gate."                       | Emotional, journey framing, fits the "every journey" brand                               | Weakest on clarity            |

Recommendation: **A as H1, with C-style specificity in the sub-line** ("Flights, hotels, visas and holidays across Africa and beyond. Tell us where; we handle the rest."), E retired. This is a hypothesis; experiment 1 tests it.

## 4. Customer intent analysis

| Intent                                     | Rank               | Homepage role                                | Destination           |
| ------------------------------------------ | ------------------ | -------------------------------------------- | --------------------- |
| 1 Need a flight                            | **Primary**        | Hero action                                  | `/flights` quote flow |
| 5 Need help planning / 6 Talk to an expert | **Primary-assist** | Always-present WhatsApp/call, hero secondary | WhatsApp, `/contact`  |
| 3 Plan a holiday                           | Secondary          | Curated packages band                        | `/packages`           |
| 2 Need a hotel                             | Secondary          | Service tile + search tab                    | `/hotels`             |
| 4 Visa help                                | Secondary          | Service tile                                 | `/visas`              |
| 7 Researching destinations                 | Tertiary           | One editorial band                           | `/destinations`       |

Hotels, visas and holidays do not get equal billing in the hero. They get landing pages, one shared tile row on the homepage, and a tab in the widget.

**Open question that decides the hero (see section 20):** the repo shows no live fare-search API; products are listings and enquiries. If flights are enquiry-led, the primary CTA must say so ("Get a flight quote"). Writing "Search flights" over a form that only sends an enquiry repeats the trust problem in finding 1.

## 5. Conversion funnel and section mapping

Arrive -> Clarity -> Relevance -> Trust -> Desire -> Action.

| Current section           | Purpose            | Conversion role  | Problem                                                  | Verdict                       | Recommendation                                 |
| ------------------------- | ------------------ | ---------------- | -------------------------------------------------------- | ----------------------------- | ---------------------------------------------- |
| Hero                      | Orient             | Clarity, action  | Vague, broken form                                       | Rebuild                       | Section 10                                     |
| Booking widget            | Capture intent     | Action           | Does nothing, 420-option selects                         | Rebuild                       | Section 11                                     |
| Why choose us (4 cards)   | Trust              | Trust            | Generic claims anyone makes; icon cards                  | Remove                        | Replace with one evidenced line-up (see 12)    |
| Popular destinations      | Desire             | Relevance        | No route pre-fill, heavy images                          | Keep, rebuild as routes       | Route cards pre-filling the quote form         |
| Our services (6 cards)    | Inform             | Relevance        | Equal-weight menu, bad links, includes unlisted services | Merge                         | Four product entries with real counts          |
| Featured travel (4 cards) | Desire             | Desire/action    | Unverified prices, external leak                         | Move/replace                  | Pull live from packages API                    |
| 24x7 support block        | Reassure           | Trust            | Unverifiable claims, big                                 | Shrink                        | Persistent contact bar + one honest hours line |
| Ready for adventure CTA   | Close              | Action           | Duplicate of hero                                        | Remove, merge into footer CTA |                                                |
| Newsletter                | Low-intent capture | Micro-conversion | Discards data                                            | Fix, shrink                   | Footer-level, WhatsApp-or-email                |

## 6. Competitive analysis (pattern level, to re-verify live)

Treat the cells below as hypotheses from general knowledge of these products. Re-check on a clean network before they drive decisions.

| Area            | ARLink28 today         | Travelstart                  | Trip.com                         | Booking.com                 | Opportunity                                                                          |
| --------------- | ---------------------- | ---------------------------- | -------------------------------- | --------------------------- | ------------------------------------------------------------------------------------ |
| Hero            | Brand line + 1 button  | Search form is the hero      | Search form + promo strip        | Search form, minimal copy   | Search/quote form stays in hero, but add a human line they cannot copy               |
| Search steps    | Form that does nothing | Direct to live results       | Direct to live results           | Direct to live results      | Do not imitate fare search without a fare supplier; win on "we will find it for you" |
| Trust           | None                   | Reviews score, payment marks | Large scale numbers, app ratings | Review scores on every item | Real reviews + named people + WhatsApp response time                                 |
| Personalisation | None                   | Origin-aware deals           | Strong                           | Strong                      | Origin-city aware routes (Lagos, Accra, Harare, Nairobi, London diaspora)            |
| Support         | Footer phone           | Call centre                  | App + chat                       | Chat                        | WhatsApp-first, with a named agent and stated hours                                  |
| Content         | None                   | Route/deal pages             | Destination guides               | Destination guides          | Route pages (see 14)                                                                 |

The underlying lessons to adapt, not copy: one dominant task above the fold; trust visible before scrolling; every result has a price and a next step; support is reachable from any screen.

## 7. African differentiation

Make it functional, not slogan:

- **Functional.** Routes the global OTAs treat as afterthoughts: intra-African (Lagos-Accra, Nairobi-Addis, Harare-Johannesburg), diaspora (Lagos/Accra/Harare to London), visa requirements per route in the same conversation as the fare, and payment in the currency the traveller actually holds. A visa-plus-flight bundle is the strongest single differentiator in this set.
- **Emotional.** "Someone who knows this route is looking after this." Relief, not excitement.
- **Brand.** The agency African travellers message first. Human, named, fast on WhatsApp.

None of this is real until operational answers exist: response-time target, which routes are staffed with real knowledge, which currencies can be paid. The homepage must only claim what operations can deliver.

## 8. Trust and social proof audit

Today: none. Plan, in order of placement. **Do not invent figures; every number below is a placeholder to be supplied.**

| Placement         | Element                | Content needed from owner                                                                                                      |
| ----------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Hero (under CTAs) | One-line trust strip   | `[X]` travellers helped, `[hours]` WhatsApp reply time, `[registration / IATA / ATOL if applicable]`                           |
| Just below hero   | Real people and events | Photos from Farnborough 2026 summit, Harare TravelExpo (already in `public/images`) with captions; real team                   |
| Mid page          | Reviews                | Real customer reviews; the repo has a `sample-reviews` switch for placeholder data, which must stay switched off in production |
| Mid page          | Partners               | Only partners you have written permission to show                                                                              |
| Footer            | Contact bar            | Registered address, both phone numbers, WhatsApp                                                                               |

Remove claims you cannot evidence: "trusted airlines", "no waiting time", "24/7" unless staffed. Confirm accreditation status before showing any badge.

## 9. CTA hierarchy

| Level      | CTA                                                                   | Who                 | After click                                          | Friction                                 |
| ---------- | --------------------------------------------------------------------- | ------------------- | ---------------------------------------------------- | ---------------------------------------- |
| Primary    | "Get a flight quote" (or "Search flights" only if fare search exists) | High intent         | Route-prefilled quote form, 3 fields                 | Must submit to real backend              |
| Secondary  | "Plan my trip"                                                        | Medium              | Packages / enquiry                                   | Longer form                              |
| Assist     | "Chat on WhatsApp"                                                    | Anyone, esp. mobile | wa.me with pre-filled message including page context | Needs staffed number                     |
| Supporting | "Call"                                                                | Older, high-value   | tel link                                             | none                                     |
| Low        | "Get travel deals"                                                    | Researching         | Email or WhatsApp opt-in, footer                     | Needs consent text, not a pre-ticked box |

Rule: one primary button per viewport. Currently there are about 25 links and 11 "Book Now / Learn More" labels.

## 10. Hero strategy

Three concepts. Pick one for build; the others become the A/B variant.

|           | Concept 1 "Know the route"                                            | Concept 2 "One trip, one team"                            | Concept 3 "Route-first"                                                      |
| --------- | --------------------------------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------- |
| H1        | Travel across Africa with people who know the routes.                 | Flights, hotels and visas. One team.                      | Where to?                                                                    |
| Sub       | Flights, hotels, visas and holidays, arranged for you. Tell us where. | Everything for the trip, handled by one team on WhatsApp. | Lagos, Nairobi, Accra, Harare, London... pick a route, get a quote.          |
| Primary   | Get a flight quote                                                    | Plan my trip                                              | Get a quote                                                                  |
| Secondary | Chat on WhatsApp                                                      | Chat on WhatsApp                                          | Chat on WhatsApp                                                             |
| Form      | 3 fields: From, To, When (+ phone/WhatsApp)                           | Single textarea + contact                                 | Route typeahead as the hero itself                                           |
| Trust     | `[X]` travellers, reply-in-`[N]`-min                                  | Team photo strip                                          | Real route price from `[date]` where verified                                |
| Visual    | One real photograph, full bleed, optimised                            | Short looped portrait video (<1.5 MB, poster)             | Typographic route board, no photo                                            |
| Rationale | Clearest, safest, matches section 3                                   | Strongest for non-flight intent                           | Strongest Awwards candidate (interactive, typographic), riskiest for clarity |

Recommendation: Concept 1 as the default; Concept 3's route board as the interactive signature element beneath it.

## 11. Booking UX strategy

- Unified entry, **not** four equal tabs. One **"What do you need?"** segmented control: Flight (default), Hotel, Visa, Holiday, each with the minimum fields.
- Flight: From (typeahead, defaulting by IP region), To (typeahead), Dates (single range picker, "flexible" checkbox), Travellers, then contact method. Passengers and cabin collapse behind "more options".
- Replace the 420-option `<select>` with a searchable combobox (accessible, keyboard, mobile full-screen sheet). Data from one source, not hard-coded in JSX.
- Defaults: today+14 days, 1 adult, round trip.
- Submit: POST to the enquiries backend you already built; success state shows reference number, who replies and when, and a WhatsApp link.
- Errors inline, per field, in plain words. Loading state on the button. No form reset on failure.
- Mobile: the form becomes a full-screen sheet from a single sticky button.

## 12. Recommended homepage order

| #   | Section                                                                  | Answers                    | Primary / secondary CTA | Must not include                                                 |
| --- | ------------------------------------------------------------------------ | -------------------------- | ----------------------- | ---------------------------------------------------------------- |
| 1   | Header (5 items: Flights, Hotels, Visas, Holidays, Help; contact button) | Where am I                 | Get a quote / WhatsApp  | About, Team, Engagement, Opportunities, Sign in (move to footer) |
| 2   | Hero + quote form + trust strip                                          | What is this, what do I do | Get a quote / WhatsApp  | Marketing slogans, carousels                                     |
| 3   | Routes board (6-8 routes, pre-fills form)                                | Can you do my route        | Pick route              | 10 identical cards                                               |
| 4   | How it works (3 steps: tell us, we quote, you travel)                    | What happens next          | Get a quote             | Icon-card grid                                                   |
| 5   | Visa + flight together (the differentiator)                              | Why you over an app        | `/visas`                | Generic claims                                                   |
| 6   | Curated packages (live from API)                                         | I want a holiday           | `/packages`             | Hard-coded prices                                                |
| 7   | Real people and proof (events, team, reviews)                            | Can I trust you            | WhatsApp                | Invented stats                                                   |
| 8   | Destination journal (2-3 pieces)                                         | Researching                | `/destinations`         | Long text                                                        |
| 9   | Closing CTA + FAQ (5 questions, schema)                                  | Last objections            | Get a quote             | Newsletter wall                                                  |
| 10  | Footer (contact, legal, newsletter)                                      | Reachability               | WhatsApp                |                                                                  |

Ten blocks, down from nine plus nested sections, but each answers one question; total length should fall, not grow.

## 13. Mobile conversion strategy

- Design the 390 px view first. Sticky bottom bar: **Get a quote** + **WhatsApp** (two targets, 48 px min).
- Quote form as a bottom sheet with three steps maximum, large inputs, `inputmode`/`autocomplete` set, no horizontal scroll.
- Hero image under 150 KB at mobile width, AVIF/WebP, `priority`; no video on cellular by default (`prefers-reduced-data`).
- Disable scroll-reveal choreography on mobile; keep one well-made transition.
- Budgets: JS under 150 KB gzipped on home, LCP under 2.5 s on Slow 4G, INP under 200 ms.

## 14. SEO, AEO and GEO strategy

No ranking claims are made.

- **Fix first:** title, description, canonical, Open Graph and Twitter images, `lang`, sitemap, robots. Reposition away from "airline".
- **Structured data:** `Organization` + `TravelAgency` (only with real address/registration), `WebSite` with sitelinks search, `FAQPage` on homepage and route pages, `Product`/`Offer` only on listings with real prices, `BreadcrumbList`.
- **Route pages** (`/flights/lagos-to-nairobi`, etc.): one page per route you can genuinely serve, with who flies it, typical duration, visa note, how to get a quote. Generate from data, not copy-paste, and noindex any route without real content (avoid thin-page bloat).
- **AI answerability:** for "book flights from Johannesburg to Lagos" an assistant needs a page that states plainly who you are, what you can arrange, how to contact you, and what you charge. Write short, factual, quotable paragraphs; consistent entity naming (ARLink28, not ARLinks); consistent NAP across site, Google Business Profile, socials. Consider an `llms.txt`.
- Internal linking: homepage -> route pages -> package/visa pages; breadcrumbs everywhere.

## 15. Analytics and tracking

Currently none. Add a consent-gated, lightweight setup (GA4 or Plausible/PostHog; owner decision) behind one `track()` wrapper.

| Event                              | When                                 |
| ---------------------------------- | ------------------------------------ |
| `hero_cta_click` {cta}             | Hero buttons                         |
| `quote_started` {product}          | first field interaction              |
| `quote_submitted` {product, route} | success                              |
| `quote_error` {field}              | validation fail (abandonment signal) |
| `route_card_click` {route}         | route board                          |
| `package_click` {slug}             | package card                         |
| `whatsapp_click` {placement}       | any wa.me link                       |
| `phone_click` {placement}          | tel link                             |
| `visa_enquiry_submitted`           | visa flow                            |
| `newsletter_signup`                | footer                               |
| `review_interact`                  | review carousel                      |
| `booking_completed`                | server-confirmed, not client         |

Macro conversions: `quote_submitted`, `visa_enquiry_submitted`, `booking_completed`. Micro: WhatsApp/phone clicks, route clicks, newsletter. Abandonment: `quote_started` without `quote_submitted`, `quote_error`.

## 16. A/B testing roadmap

Only after fixes P0 and basic analytics, and only with enough traffic to read a result. Do not promise uplift.

| #   | Hypothesis                                                       | Variable                           | Metric                           | Effort | Priority |
| --- | ---------------------------------------------------------------- | ---------------------------------- | -------------------------------- | ------ | -------- |
| 1   | A human-and-route headline gives clearer value than a brand line | H1 A vs "We connect every journey" | quote_started rate               | Low    | P1       |
| 2   | "Get a quote" sets honest expectation vs "Search flights"        | CTA label                          | quote_submitted                  | Low    | P1       |
| 3   | A sticky WhatsApp bar adds conversations without cutting forms   | Mobile bar on/off                  | whatsapp_click + quote_submitted | Low    | P1       |
| 4   | Route board above vs below how-it-works                          | Order                              | route_card_click                 | Low    | P2       |
| 5   | Trust strip in hero vs after hero                                | Placement                          | quote_started                    | Low    | P2       |
| 6   | Reviews before routes vs after                                   | Order                              | scroll depth to CTA              | Medium | P3       |

## 17. Design system direction (and Awwards)

Own the constraint set you already set: the UI must not look AI-generated or templated (no glows, card kits, gradient washes, emoji or pun copy).

**What to retire:** glassmorphism panels, red glow shadows, circle-icon feature cards, uniform six-up grids, Font Awesome everywhere, reveal-on-everything.

**Direction: "Departures board meets editorial."** Warm off-white and deep ink as the base (a dark theme can exist, but the current near-black plus red glow is the least distinctive option available), one accent kept from the existing brand red but used flat and rarely, large photographic crops of real African cities and people, a strong display serif or grotesk paired with a clean text face, tabular numerals for fares and flight data, route codes (LOS-NBO) as a recurring typographic motif. African-ness comes from real photography, real route names and specific language, not patterns or silhouettes.

**Awwards reality check:**

- The jury weighs design, usability, creativity and content. Heavy WebGL on the route to a quote form is the usual way travel sites lose usability score.
- Plan **one signature interaction**: the route board (typographic, keyboard-accessible, responds to the cursor/touch, resolves into the quote form). Everything else is typographic restraint.
- Nominations require a live, polished, finished site with strong performance and accessibility. Budgets in section 13 apply, and a pre-submission checklist should include AA contrast, reduced-motion support, and Lighthouse 90+.
- Photography and copy are the biggest gaps between "good" and "nominated". Budget for a real photo shoot or licensed African-photographer imagery.
- Honest odds: Awwards recognition is not a guarantee of any process; treat it as a design-quality target, and conversion as the commercial one.

## 18. Technical implementation plan

Existing: Next 14 App Router, route groups `(web)` and `(admin)`, per-page CSS in `app/(web)/styles/`, global tokens in `globals.css`, `components/products/*` and `components/packages/*` already shared with the new product pages, an enquiry backend and `EnquiryForm`, no analytics, no image pipeline, static-export leftovers (`/book/flight.html`).

Principles: don't rewrite the app; build a new `components/home/*` set; reuse `products/*` cards and `EnquiryForm`; keep per-page CSS convention; no new heavy dependencies without a reason (a small combobox and a date picker only; GSAP/Lenis only if the signature interaction needs it).

| Phase               | Work                                                                                                                                       | Output           |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------- |
| 0 Stop the bleeding | Wire hero form + newsletter to the enquiry API; fix title/description; replace `nav.png` with an optimised image; drop dead `/book/*.html` | No lost leads    |
| 1 Foundation        | Tokens, type, buttons, spacing, `next/font`, `next/image` helper, icon set as SVG sprite                                                   | Design system v2 |
| 2 Hero              | Copy, quote sheet, combobox, trust strip, sticky mobile bar                                                                                | New hero         |
| 3 Sections          | Routes board, how-it-works, visa+flight, live packages, proof                                                                              | Page body        |
| 4 Leads             | WhatsApp deep links with context, consent-correct newsletter                                                                               | Capture          |
| 5 SEO               | Metadata, JSON-LD, FAQ, route pages, sitemap                                                                                               | Discoverability  |
| 6 Analytics         | `track()` wrapper, events in section 15, funnels                                                                                           | Measurement      |
| 7 Testing           | Experiments, heatmaps                                                                                                                      | Iteration        |

## 19. Prioritised backlog

| Item                                                         | Impact | Effort | Priority                      |
| ------------------------------------------------------------ | ------ | ------ | ----------------------------- |
| Wire hero form and newsletter to real backend                | High   | Low    | **P0**                        |
| Fix `<title>`/description, remove airline claim              | High   | Low    | **P0**                        |
| Replace 13.6 MB hero background; `next/image` for all photos | High   | Low    | **P0**                        |
| Remove public "Sign in" from header; reduce nav to 5         | Medium | Low    | P1                            |
| Sticky WhatsApp + quote bar on mobile                        | High   | Low    | P1                            |
| New hero copy and quote form with combobox                   | High   | Medium | P1                            |
| Route cards that pre-fill the form                           | High   | Medium | P1                            |
| Remove or evidence all unverified claims and prices          | High   | Low    | P1                            |
| Analytics wrapper and events                                 | High   | Medium | P1                            |
| Proof section with real content                              | High   | Medium | P1 (blocked on owner content) |
| JSON-LD, canonical, OG images, sitemap                       | Medium | Low    | P1                            |
| Packages from API on homepage                                | Medium | Low    | P2                            |
| Design system v2 and signature route board                   | Medium | High   | P2                            |
| Route landing pages                                          | High   | High   | P2                            |
| Reveal-animation reduction, font and icon cleanup            | Low    | Low    | P3                            |
| A/B programme                                                | Medium | Medium | P3                            |

## 20. Definition of done

- Every form on the homepage submits to a real backend, shows a confirmation, and is covered by a Playwright test.
- No claim on the page lacks a source the owner has confirmed; no invented numbers.
- LCP under 2.5 s and INP under 200 ms on throttled Slow 4G mobile; CLS under 0.1; home JS within budget; no image over its displayed size by more than 2x.
- WCAG 2.2 AA: contrast, focus, keyboard route board, `prefers-reduced-motion`.
- One primary CTA per viewport; every event in section 15 fires and appears in a funnel.
- Metadata, canonical, OG, JSON-LD validated; FAQ schema matches visible text.
- Tested at 360, 390, 768, 1280, 1920.
- A pre-agreed Awwards submission checklist passed (section 17).

## Decisions (owner, 2026-10-02)

1. **What ARLink28 is:** a travel agency and enquiry service today, with its own airline as a future goal. The homepage says so plainly ("Not yet" an airline) and never claims to operate flights.
2. **Supplier API:** none planned yet, so the flow is enquiry-led. The primary action is "Get a quote", not "Search flights".
3. **Proof:** reviews, traveller count, accreditation, partner permissions and staffed WhatsApp hours all exist but are not supplied yet. Placeholders ship in `apps/web/content/home-proof.ts`, shown in square brackets while `SAMPLE` is true.
4. **Visual direction:** keep the dark theme, with a refined Apple-style frosted surface for an expensive feel (blurred pane, hairline edge, faint top highlight; no coloured glow).
5. Photography budget and analytics tool: still open. The `track()` wrapper feeds `window.dataLayer` until a tool is chosen.

## Build status

Branch `feature/homepage-redesign`. Done: phase 0 (forms wired to the enquiries API, metadata, hero image from 13.6 MB to 101 KB), phases 1 to 4 for the homepage (hero, two-step quote form, route board, how it works, services, live packages, proof, FAQ, closing), JSON-LD, `track()` events. Not done: site-wide header and footer redesign, route landing pages, real proof content, analytics tool, A/B tests.
