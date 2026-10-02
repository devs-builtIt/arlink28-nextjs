# ARLink28 homepage design system

Reference studied: `https://traveli.framer.website/` (a Framer template by Template Munk), inspected live on 2026-10-02 at a 1440 x 778 viewport.
Status: **specification, awaiting approval. Nothing here is built yet.**

This file does two jobs. Part A records the reference system exactly as measured. Part B turns it into the ARLink28 homepage. Where a value was measured it says so; where it is my recommendation it says so.

## 0. What was measured and what was not

| Measured on the live page                                                               | Not measured (treat as to-verify)                                                                      |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Fonts in use and every text style (family, size, weight, line height, tracking, colour) | Animation durations and easing curves                                                                  |
| Colours, radii, shadows, section heights and paddings, container width                  | The ripple canvas's behaviour (it is a `<canvas>` in the hero; I saw that it exists, not what it does) |
| Initial state of the appear animation (opacity 0.001, translateY 10px)                  | Scroll-linked effects such as the grey "Destination Plan" backdrop                                     |
| Smooth scroll library present (the `lenis` class is on the page)                        | Lenis settings, hover states beyond `background` and `box-shadow` transitions                          |
| Sticker rotation (exactly -15 degrees), ticker structure                                | Mobile layout (only 1440 px was inspected)                                                             |

The reference is **light**: white canvas, near-black ink. ARLink28 has so far been **dark** with frosted surfaces. See the decision in section 12.

Also: Traveli is a paid commercial template. This spec takes its **system and structure** only. Do not copy its text, photography or icons.

---

# Part A. The reference system as measured

## 1. Typography

Families found loaded: **Satoshi** (400, 500, 700) for nearly everything, **Geist** 600 and **Inter Display** 700 only in the Framer promo badge, which is not part of the design.

Satoshi is distributed by Fontshare under the ITF Free Font License, which allows commercial use and website embedding. Confirm the licence text when downloading, then self-host the WOFF2 files.

| Role          | Size / line height | Weight           | Tracking           | Colour            | Where it appears            |
| ------------- | ------------------ | ---------------- | ------------------ | ----------------- | --------------------------- |
| Display XL    | 150 / 150 px       | 700              | -4.5 px (-0.03em)  | #212121           | The big stat number         |
| Display L     | 120 / 120 px       | 700              | -3.6 px (-0.03em)  | #212121           | Marquee words ("Explore")   |
| Display M     | 100 / 100 px       | 700              | -3 px              | #212121           | Rating "4.9"                |
| Headline      | 64 / 64 px         | 700              | -1.92 px (-0.03em) | white on photo    | Hero headline               |
| Section title | 48 / 54 px         | 700              | -1.44 px (-0.03em) | #212121           | Every section heading       |
| Stat suffix   | 36 / 36 px         | 500              | -1.08 px           | #212121           | "% OFF"                     |
| Card title    | 32 / 32 px         | 700              | -0.96 px           | white on photo    | Destination plan cards      |
| Lead          | 24 / 34 px         | 400              | normal             | #555555           | Quotes and intro paragraphs |
| Body          | 16 / 26 px         | 400              | normal             | #555555 or white  | Descriptions, form labels   |
| UI strong     | 16 / 16 px         | 500 or 700       | normal             | #212121           | Names, reassurance line     |
| Button        | 14 / 14 px         | 700, capitalised | normal             | white on dark     | Buttons                     |
| Nav           | 14 / 14 px         | 500, capitalised | normal             | #212121           | Header links                |
| Caption       | 14 / 14 px         | 400 or 500       | normal             | #555 or white 75% | Roles, rating line          |

The rule behind the table: **tracking is always -0.03em and line height is 1.0 on display sizes** (1.125 on the 48 px title). Weight is 700 for anything large, 400 for reading text. There is one family; hierarchy comes from size and weight only.

## 2. Colour

| Token          | Value                        | Use (observed)                                     |
| -------------- | ---------------------------- | -------------------------------------------------- |
| Canvas         | `#FFFFFF`                    | Page background, cards                             |
| Ink            | `#212121`                    | Headings, primary buttons, body emphasis           |
| Ink secondary  | `#555555`                    | Paragraphs, captions                               |
| Black          | `#000000`                    | Image overlays, shadows                            |
| Footer / deep  | `#121212`                    | Footer-level dark surface                          |
| Soft fill      | `rgba(33,33,33,0.04)`        | Panels, the deals block (looks about #F5F5F5)      |
| Hairline fill  | `rgba(33,33,33,0.1)`         | Dividers (drawn as an inset 1 px shadow in Framer) |
| Chip on photo  | `rgba(218,218,218,0.75)`     | Location tags over images                          |
| Glass on photo | white at low alpha with blur | Hero search panel                                  |

There is **no accent colour**. The only colour on the page comes from photography. All emphasis is black on white.

## 3. Shape, elevation and spacing

| Thing                  | Value                                                                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Radius, default        | **12 px** (95 elements use it: buttons, cards, images)                                                                                |
| Radius, other          | 10 px (small), 20 px (sticker pills), 100 px (pills), 100% (circles)                                                                  |
| Shadow, sticker        | `0 10px 20px rgba(0,0,0,0.16)`                                                                                                        |
| Shadow, floating image | `0 30px 60px rgba(0,0,0,0.14)`                                                                                                        |
| Page gutter            | **30 px** each side                                                                                                                   |
| Container              | max **1300 px** wide, centred                                                                                                         |
| Section padding        | 65 px top and bottom as standard; **130 px** on the three emphasis sections (Why Choose Us bottom, Destination Plan, Testimonial top) |
| Header                 | 76 px tall, 30 px side padding, transparent over white                                                                                |
| Button                 | 46 px tall, 12 px radius, padding 13 / 16 px, fill `#212121`, text white                                                              |
| Secondary button       | same size, fill white, text `#212121`                                                                                                 |

## 4. Page structure (section order, heights at 1440 px)

| #   | Section          | Height | What it is                                                                                                                                                                                                                                                           |
| --- | ---------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Header           | 76     | Logo, 4 links (one with a dropdown), dark "Get A Quote" button                                                                                                                                                                                                       |
| 2   | Hero             | 778    | A full-width rounded photo card (12 px radius) inset by the gutter. A rating line on the photo, and a frosted search panel docked bottom right (Where to, Departure, Return, Traveller, "Explore Now"). Below the photo, three plain reassurance statements in a row |
| 3   | About            | 1049   | Centred section title with a rotated sticker label, then a collage of four photos each tilted a different way, overlapping                                                                                                                                           |
| 4   | Feature          | 700    | A 3 x 2 grid of cells divided by hairlines: a line icon, a bold title, two lines of text                                                                                                                                                                             |
| 5   | Brands           | 164    | A "happy sponsors" count and a single row of partner logos                                                                                                                                                                                                           |
| 6   | Destinations     | 1322   | Title and a quiet "More" button; a 6-card masonry-like grid of tall and wide photos with a location chip, a name and a price                                                                                                                                         |
| 7   | Quote ticker     | 250    | One line of 120 px words scrolling sideways                                                                                                                                                                                                                          |
| 8   | Why Choose Us    | 987    | Title with sticker; a large photo left, three icon-and-text rows right separated by hairlines, a circular rotating badge on the photo corner                                                                                                                         |
| 9   | Destination Plan | 954    | A grey backdrop, white title, three tall photo cards with the name set on the photo                                                                                                                                                                                  |
| 10  | Testimonials     | 937    | Title; a card with a 100 px rating and a circular image; two review cards, staggered                                                                                                                                                                                 |
| 11  | Deals            | ~470   | A soft grey rounded panel: a 150 px "30" with "% OFF" set vertically, the title, an email field with a Subscribe button, and three tilted photos with shadows                                                                                                        |
| 12  | CTA banner       | 838    | A dark photo banner with the title and tilted photos                                                                                                                                                                                                                 |
| 13  | Process          | 613    | Three bordered step cards: step number, text, title, small icon                                                                                                                                                                                                      |
| 14  | FAQ              | 760    | Title; accordion cards, one open by default                                                                                                                                                                                                                          |
| 15  | Blog             | 772    | Three posts with dates                                                                                                                                                                                                                                               |
| 16  | Gallery          | 809    | Social feed grid                                                                                                                                                                                                                                                     |
| 17  | Footer           | ~400   | Brand and contact, two link columns, copyright                                                                                                                                                                                                                       |

**Signature devices** (what makes it feel designed, not templated):

1. **Sticker labels.** Each section title carries a small white pill (radius 20, shadow above) rotated **exactly -15 degrees** that overlaps the headline.
2. **Tilted photo collages** with soft large shadows instead of a rigid grid.
3. **One display-size number** (150 px) as a visual anchor.
4. **A marquee of huge words** as a pause between sections.
5. **Hairline cards** with almost no fill, so the page stays airy.
6. **Photography does all the colour work.**

## 5. Motion

Measured:

- **Smooth scrolling** through Lenis (class `lenis` on the page).
- **Appear on scroll:** elements start at `opacity: 0.001` and `translateY(10px)` with `will-change: transform`, then move to full opacity and rest position.
- **Marquee ticker:** a flex row with 100 px gaps, driven continuously, starting hidden (`opacity: 0`) and fading in.
- **Hero ripple:** a `<canvas>` layer inside the hero (behaviour not measured).
- **Hover:** buttons transition `background` and `box-shadow`.

Not measured, so **recommended values, not copied ones** (section 9).

---

# Part B. The ARLink28 homepage

## 6. Tokens (CSS custom properties)

Light is the reference as measured. Dark is the derived inverse, so the decision in section 12 does not block build.

```css
:root {
  /* type */
  --font-display: "Satoshi", system-ui, sans-serif;
  --font-body: "Satoshi", system-ui, sans-serif;
  --track-display: -0.03em;

  /* light, as measured */
  --canvas: #ffffff;
  --ink: #212121;
  --ink-2: #555555;
  --fill-soft: rgba(33, 33, 33, 0.04);
  --hairline: rgba(33, 33, 33, 0.1);
  --chip: rgba(218, 218, 218, 0.75);
  --on-photo: #ffffff;
  --btn-bg: #212121;
  --btn-fg: #ffffff;

  /* shape */
  --radius: 12px;
  --radius-sticker: 20px;
  --gutter: 30px;
  --container: 1300px;
  --section-y: 65px;
  --section-y-lg: 130px;
  --header-h: 76px;

  /* elevation */
  --shadow-sticker: 0 10px 20px rgba(0, 0, 0, 0.16);
  --shadow-float: 0 30px 60px rgba(0, 0, 0, 0.14);
}

:root[data-theme="dark"] {
  --canvas: #0a0d12;
  --ink: #f5f7fa;
  --ink-2: #9aa6b8;
  --fill-soft: rgba(255, 255, 255, 0.05);
  --hairline: rgba(255, 255, 255, 0.1);
  --chip: rgba(255, 255, 255, 0.14);
  --btn-bg: #ffffff;
  --btn-fg: #0a0d12;
}
```

**Brand accent.** The reference has none. ARLink28's red (`#e61e2b`) stays as a single optional accent for one element only: the primary "Get a quote" button, so the page keeps one clear action. Everything else is ink on canvas.

## 7. Type scale to build

Use the measured scale unchanged, with fluid clamps for small screens:

| Token           | Desktop       | Mobile (390 px) |
| --------------- | ------------- | --------------- |
| `display-xl`    | 150 / 1.0     | 88 / 1.0        |
| `display-l`     | 120 / 1.0     | 64 / 1.0        |
| `headline`      | 64 / 1.0      | 40 / 1.05       |
| `section-title` | 48 / 1.125    | 32 / 1.15       |
| `card-title`    | 32 / 1.0      | 24 / 1.1        |
| `lead`          | 24 / 1.42     | 18 / 1.5        |
| `body`          | 16 / 1.625    | 16 / 1.6        |
| `ui`            | 14 / 1.0, 700 | 14 / 1.0        |

Tracking is `-0.03em` on everything 32 px and up; normal below. **Mobile sizes are my recommendation**; the reference was only measured on desktop.

Font delivery: self-host WOFF2 (Satoshi 400, 500, 700, Latin), `font-display: swap`, preload the 700 file, expect about 60 to 90 KB total. Replace the Instrument Serif and Geist pair currently on the homepage and in `chrome.css`.

## 8. Section plan for ARLink28 (mapped from the reference)

Same order and devices as the reference; content stays ARLink28's own and honest. Placeholders follow the existing `content/home-proof.ts` convention.

| #   | Reference section   | ARLink28 section            | Content and rules                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --- | ------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Header              | Header                      | Logo; Flights, Hotels, Visas, Holidays, About; dark "Get a quote" button (the one red accent, if approved)                                                                                                                                                                                                                                                                                                                                         |
| 2   | Hero photo card     | Hero                        | Photo card with the old sunset-plane background (optimised). Headline "Travel across Africa with people who know the routes." Frosted quote panel docked bottom right (existing two-step quote form). Rating line shows `[X] stars on [platform]` as a placeholder until real. Three reassurance lines under the card, **only ones that are true**: "A person replies with a price", "No payment until you agree", "Support by WhatsApp and phone" |
| 3   | About / Our History | **Where we are going**      | Sticker "Our story". Title: "We don't just book trips. We know the routes." (or the owner's wording). Tilted collage of the **real event photos** (Harare TravelExpo, Farnborough, House of Lords, livery aircraft). Includes the honest line: travel agency today, airline next                                                                                                                                                                   |
| 4   | Feature 3 x 2       | **Why ARLink28**            | Six hairline cells, each an **evidenced** point, line icons. Draft: A person quotes every trip. Flight, hotel and visa in one conversation. Lagos and London offices. WhatsApp support. Clear change and refund rules. Routes across Africa and the diaspora. Remove any point the business cannot prove                                                                                                                                           |
| 5   | Brands              | Partners                    | Hidden until partner permissions exist (`PARTNERS` is empty)                                                                                                                                                                                                                                                                                                                                                                                       |
| 6   | Destinations        | **Routes and destinations** | Cards with location chip, name, and "Quote on request" instead of a price (no fare feed exists). Clicking prefills the quote form (existing behaviour)                                                                                                                                                                                                                                                                                             |
| 7   | Ticker              | Marquee                     | 120 px words: "Flights", "Hotels", "Visas", "Holidays", "Across Africa and beyond"                                                                                                                                                                                                                                                                                                                                                                 |
| 8   | Why Choose Us       | **How we work**             | Large photo; three rows: Tell us where, We price it, We book it. Rotating circular badge reads "Get a quote"                                                                                                                                                                                                                                                                                                                                       |
| 9   | Destination Plan    | **Holiday packages**        | Live from the packages API, three cards with name on photo                                                                                                                                                                                                                                                                                                                                                                                         |
| 10  | Testimonials        | Reviews                     | Rating card and two review cards, **placeholders** bracketed until real                                                                                                                                                                                                                                                                                                                                                                            |
| 11  | Deals               | Travel deals                | Email capture to the enquiries backend, tilted photos. No "% off" figure unless a real offer exists                                                                                                                                                                                                                                                                                                                                                |
| 12  | CTA banner          | Closing call to action      | "Tell us where. We'll handle the rest." with quote and WhatsApp                                                                                                                                                                                                                                                                                                                                                                                    |
| 13  | Process             | Steps                       | Three hairline step cards (already written)                                                                                                                                                                                                                                                                                                                                                                                                        |
| 14  | FAQ                 | FAQ                         | Accordion; schema stays in sync with visible text                                                                                                                                                                                                                                                                                                                                                                                                  |
| 15  | Blog                | Journal                     | Hidden until there are real posts                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 16  | Gallery             | Instagram                   | Link grid to the real account; hidden if empty                                                                                                                                                                                                                                                                                                                                                                                                     |
| 17  | Footer              | Footer                      | Existing content (offices, phones, legal, staff sign-in), restyled to tokens                                                                                                                                                                                                                                                                                                                                                                       |

Cut for length if needed, in this order: Gallery, Blog, Brands (already conditional), Deals. The reference page is 12,449 px tall; keep ARLink28's under about 9,000 px.

## 9. Components

- **Button primary:** 46 px, radius 12, fill `--btn-bg`, text 14 px / 700 capitalised. Hover: lift the fill one step and add a faint shadow; no movement.
- **Button secondary:** white fill (canvas), ink text, same size, hairline border.
- **Sticker:** white pill, radius 20, padding about 14 x 20, 14 px / 500 text, `--shadow-sticker`, `rotate(-15deg)`, overlapping the headline's top-left. Decorative; marked `aria-hidden` with the same words available as an eyebrow for screen readers.
- **Photo card:** radius 12, location chip top-left (`--chip`, 12 px radius, 12 px text), title and price below or on the photo.
- **Hairline card:** transparent fill, `1px solid var(--hairline)`, radius 12, padding 24.
- **Frosted panel (hero):** keep the existing blurred pane; it is the one place glass is used.
- **Accordion:** hairline cards, first open, chevron icon rotates 180 degrees.
- **Marquee:** `display:flex; gap:100px`, `translateX` loop, pauses on hover and under `prefers-reduced-motion`.

## 10. Motion spec (recommended, not measured)

| Effect         | Spec                                                                                                                                                   | Why this value                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| Appear         | opacity 0 to 1 and `translateY(10px)` to 0, **600 ms**, `cubic-bezier(0.22, 1, 0.36, 1)`, triggered once when 15% visible, children staggered by 70 ms | Initial state is measured; timing is chosen to feel the same |
| Smooth scroll  | Lenis, `lerp: 0.1`, disabled under reduced motion and on touch                                                                                         | Reference uses Lenis; its settings were not read             |
| Marquee        | 40 s linear loop for 120 px words                                                                                                                      | Slow enough to read                                          |
| Sticker        | Fade and rotate in from `rotate(-25deg)` to `-15deg`, 500 ms                                                                                           | Adds life without distraction                                |
| Collage        | Photos settle from slightly larger rotation, 700 ms, staggered                                                                                         | Matches the tilted-stack look                                |
| Hover on cards | Image scale 1.03, 500 ms                                                                                                                               | Subtle                                                       |
| Hero ripple    | **Skip for v1.** A full-size canvas is costly on low-end Android; revisit after performance is measured                                                | Not measured on the reference                                |

Rules: only `opacity` and `transform` animate; everything respects `prefers-reduced-motion`; no animation blocks content or input; INP budget stays under 200 ms. Lenis is the riskiest item for scroll performance on cheap phones, so it ships behind a flag and is tested on a mid-range Android before launch.

## 11. Layout and responsive

- Container 1300 px max, 30 px gutters (20 px under 640 px).
- Breakpoints: 640, 960, 1300. Header collapses to the existing menu sheet at 960.
- Hero photo card keeps its 12 px radius at every width and drops the quote panel **below** the photo under 960 px.
- Feature grid 3 columns, then 2, then 1. Destination grid becomes a single column of cards on phones.
- Sticky bottom "Get a quote and WhatsApp" bar stays on phones.

## 12. Decisions (owner, 2026-10-02)

1. **Light and dark, both.** The homepage ships both themes. It follows the visitor's system setting, and a toggle in the header overrides it and is remembered (`localStorage`, key `arlink-theme`). This is what makes the design ours rather than a copy of the white-only reference.
2. **Red button kept.** `#e61e2b` is used only for the primary action ("Get a quote", the closing call to action, the "how it works" badge). Everything else is ink on canvas.
3. **Satoshi downloaded** from Fontshare (ITF Free Font License v2.0, which allows commercial use and self-hosting on our own site). The variable WOFF2 is in `apps/web/public/fonts/` with its licence text. **The licence forbids redistributing the font files, so keep this repository private.**
4. Still open: hero photography, and the real copy and evidence for the six "Why ARLink28" cells.

## 12a. Built so far, and how it differs from the plan

Branch `feature/homepage-redesign`.

| Built                                                                                                                                             | Notes                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tokens (`app/styles/tokens.css`), Satoshi, light and dark                                                                                         | Theme applies to the homepage only. The older pages sit in the `(web)` route group, where the header and footer are forced dark with `data-theme="dark"` until those pages are migrated |
| Header, footer                                                                                                                                    | Re-themed; theme toggle on the homepage only                                                                                                                                            |
| Hero photo card, quote panel, three assurance lines                                                                                               | Frosted panel keeps its own always-light-on-dark colours because it sits on a photo                                                                                                     |
| Story with tilted real-photo collage and rotated sticker labels                                                                                   | Stickers are -15 degrees as measured                                                                                                                                                    |
| Six hairline cells, route cards (tall and wide), marquee, how it works, live packages, reviews (placeholders), deals sign-up, FAQ, closing banner |                                                                                                                                                                                         |
| Appear-on-scroll (opacity and `translateY(10px)`), marquee, hover                                                                                 | Reveal respects reduced motion                                                                                                                                                          |

Deliberately not built, and why:

- **Process step cards.** They duplicated "How it works", so only one version is on the page.
- **Brands, Blog, Gallery.** Nothing real to show yet; each is conditional on content.
- **Lenis smooth scroll.** Adds a dependency and is the riskiest item for scroll performance on low-end phones. Revisit after real-device testing.
- **Hero ripple canvas.** Not measured on the reference and costly on low-end Android.
- **The 150 px stat number.** Without a verified figure it would be an invented number.
- **Deals sign-up** writes a General enquiry to the enquiries inbox ("Travel deals sign-up"), because no mailing list exists yet.

## 13. Build order

1. Tokens and Satoshi in `chrome.css`; header and footer re-themed.
2. Hero card with the quote panel.
3. Sticker, collage, hairline-card and marquee components.
4. Sections 3 to 14 in order, behind the proof placeholders.
5. Motion layer (appear, marquee, sticker), then Lenis behind a flag.
6. Performance pass on a throttled mid-range device; run the Playwright suite.

## 14. Definition of done

- Every text style matches section 1 within 1 px at 1440 px and degrades per section 7.
- Page uses no font other than Satoshi.
- Motion animates only `opacity` and `transform`, and is fully disabled under `prefers-reduced-motion`.
- LCP under 2.5 s and INP under 200 ms on a throttled mid-range phone profile; no horizontal scroll at 360, 390, 768, 1280 and 1920.
- WCAG 2.2 AA contrast: `#555555` on white is 7.5:1, but `rgba(255,255,255,0.75)` over photography must be checked per image.
- No Traveli text, imagery or icons appear anywhere.
- Playwright suite passes.
