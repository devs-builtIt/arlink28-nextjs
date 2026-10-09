# Destinations — Plan

> **Status:** 2026-10-09. Steps 1 to 5 are built; what is left is for the owner to do. API (`arlink28-api`, branch `feature/destination-profiles`): data model, public read, admin endpoints, country filter on packages, and the `seed-destinations` command with the first write-ups (`Data/Seed/destination-content.json`). Web (branch `feature/destinations`): regenerated API client, public `/destinations` pages, the staff console at `/admin/destinations`, and the review copy of the content in [`destinations-content.md`](./destinations-content.md). **Not done, and not mine to do:** apply migration 004, run `seed-destinations`, check the facts listed in the content doc, add a photo for Makgadikgadi Pans, and publish. Nothing is live. Descriptions render as plain paragraphs, not Markdown, to match packages.

## 1. Where we are

- `/destinations` is a stub (`apps/web/app/(web)/destinations/page.tsx`): it renders "Loading…" and carries leftover CSS from the old static site. There is no real page.
- The API already has a `Destination` entity, but it is a thin lookup row: `Slug`, `Name`, `Country` (`Data/Entities/Destination.cs`). It exists so packages, properties and the package filter can point at a place.
- Today's rows are Kenya-heavy: Nairobi, Masai Mara, plus Accra (added by `003_destination_accra.sql`). Zanzibar and other places are mentioned in notes but not seeded.
- The only API surface is a public `GET /api/v1/destinations` (`ReferenceController`). There is **no way to add or edit a destination** except hand-written SQL.
- Admin packages already show the pattern to copy: `[Authorize]` controller under `/admin/...`, request/response records, a service behind an interface, photo upload through `IMediaStorage`, audit log.

## 2. Decisions (defaults I'll build unless you say otherwise)

| #   | Decision | Why |
| --- | -------- | --- |
| D1  | **Extend `Destination` rather than create a second entity.** Add profile fields and a status. | Packages, properties and filters already key off it. A parallel "DestinationPage" table would drift. |
| D2  | **Two levels: country destinations and places, via a nullable `ParentId`.** Egypt and Botswana are countries. Victoria Falls, Chobe, Okavango Delta, Giza and Luxor are places under them. | The brief mixes both ("Victoria Falls, Botswana tourist attractions, Egypt"). A flat list can't group "things to do in Botswana". Two levels is enough, and the schema doesn't allow deeper nesting. |
| D3  | **Attractions are their own child table** (`DestinationAttractions`): name, short description, optional photo, sort order. | "Botswana tourist attractions" is a list that staff will reorder and edit. Replace-all `PUT`, same as package stays and features (ADR 0002 style). |
| D4  | **Status `Draft` / `Published`.** Only published destinations appear publicly. | Same rule as packages. Staff can prepare Egypt without it going live half-written. |
| D5  | **Slug is immutable once published.** | Links and SEO must not break. Same as packages. |
| D6  | **Hero photo and gallery use `IMediaStorage`** (already Supabase-backed in staging). | No new storage code. Videos are out of scope. |
| D7  | **Descriptions are Markdown, rendered and sanitised on read**, as with packages. | One approach to rich text across the site. |
| D8  | **Admin writes need the existing staff login; delete is blocked when packages or properties reference the destination.** Return 409 and suggest unpublishing. | Prevents orphaning live packages. |
| D9  | **Every admin write goes to `AuditLog`.** | Existing convention. |
| D10 | **Schema change ships as `docs/migrations/004_destination_profiles.sql`, idempotent**, applied by hand to the Supabase DB like 002 and 003. | The repo has no EF migrations against the dev DB, and the pooler breaks `dotnet ef`. Seed data is mirrored in `CatalogueSeedData.cs`. |

## 3. Data model changes (API repo)

`Destinations` gains:

| Column | Type | Notes |
| ------ | ---- | ----- |
| `ParentId` | uuid, nullable, FK to `Destinations` | null = country-level. Restrict delete. |
| `Kind` | text | `COUNTRY` or `PLACE`. Redundant with `ParentId` but makes filtering and validation trivial. A `PLACE` must have a parent. |
| `Status` | text | `DRAFT` or `PUBLISHED`. Existing rows backfill to `PUBLISHED`. |
| `Tagline` | varchar(160), null | One line under the name. |
| `Summary` | varchar(400), null | Card text. |
| `Description` | text, null | Markdown, the long form. |
| `BestTimeToVisit` | varchar(200), null | e.g. "May to October, dry season". |
| `HeroPath`, `HeroAlt`, `HeroCredit` | varchar, null | Storage path, alt text, and the photographer credit (Unsplash asks for it where practical). Attractions carry `PhotoPath/Alt/Credit` too. |
| `Latitude`, `Longitude` | numeric, null | For a map later. Optional now. |
| `SortOrder` | int | Manual ordering on the index page. |

New table `DestinationAttractions`: `Id`, `DestinationId` (cascade delete), `Name` (120), `Summary` (300), `PhotoPath` (null), `SortOrder`, audit columns.

Existing `Country` (ISO-2) stays on every row. For a place it is copied from the parent and validated to match.

## 4. API

Public (no auth), added to `Features/Catalogue`:

| Method | Route | Returns |
| ------ | ----- | ------- |
| `GET`  | `/api/v1/destinations` | **Unchanged contract**, plus new optional fields. Published only. Existing consumers (package filter, quote form) keep working. |
| `GET`  | `/api/v1/destinations/{slug}` | Full profile: description, hero, parent, child places, attractions, and counts of published packages. 404 for drafts. |
| `GET`  | `/api/v1/destinations?country=BW&kind=PLACE` | Filtering for the index page. |

Admin (staff login), new `Features/AdminDestinations`, mirroring `AdminPackages`:

| Method | Route | Purpose |
| ------ | ----- | ------- |
| `GET`    | `/api/v1/admin/destinations` | List with drafts, search, status and country filters, paging. |
| `GET`    | `/api/v1/admin/destinations/{id}` | Full record, including attractions. |
| `POST`   | `/api/v1/admin/destinations` | Create as draft. Validates slug format and uniqueness, parent exists and is a country, country code matches parent. |
| `PATCH`  | `/api/v1/admin/destinations/{id}` | Partial update. Slug rejected once published. |
| `PUT`    | `/api/v1/admin/destinations/{id}/attractions` | Replace the ordered attraction list in one transaction. |
| `POST`   | `/api/v1/admin/destinations/{id}/hero` | Upload the hero photo (image types only, size cap). |
| `POST`   | `/api/v1/admin/destinations/{id}/attractions/{attractionId}/photo` | Upload an attraction photo. |
| `POST`   | `/api/v1/admin/destinations/{id}/publish` and `/unpublish` | Publishing requires a hero photo, a summary and at least one attraction (places) or one child place (countries). |
| `DELETE` | `/api/v1/admin/destinations/{id}` | Only if nothing references it. Otherwise 409. |

Errors use the existing `Problems` helpers. After this lands, regenerate `packages/api-client` (`pnpm sync`), the same flow as before.

## 5. Web

**Public**

- `/destinations` — rebuilt in the current design system (tokens, not the old CSS file). Country sections, each with its places as photo cards. A filter row by country. Cards link to the destination page; no card kit gimmicks (see the anti-AI-design rule).
- `/destinations/[slug]` — hero, summary, best time to visit, the attractions list, child places for a country, and the **published packages for that destination** (reuse `PackageCard` and the existing destination filter) with a "Get a price" link into the quote flow. A short "Plan this trip" enquiry link rather than a new form.
- `generateMetadata` per page, `TouristDestination` JSON-LD, and entries in the sitemap. Drafts return 404.
- Header "Destinations" link and the footer list stay as they are.

**Admin**

- `/admin/destinations` list, `/admin/destinations/new`, `/admin/destinations/[id]`. Same console layout, skeletons, server pagination and stepper conventions as packages (`project-packages-console-design`). Sections: Details, Photos, Attractions (sortable list), Publish.

## 6. First content set

Seed as **drafts** except where the owner has confirmed copy. Country-level first, then places.

| Country (ISO) | Places and attractions to seed |
| ------------- | ------------------------------ |
| Zimbabwe / Zambia | **Victoria Falls** (shared; see Q1). Attractions: the Falls and Devil's Pool, Victoria Falls Bridge, Zambezi sunset cruise, Zambezi National Park, white-water rafting, Victoria Falls Rainforest. |
| Botswana (BW) | **Chobe National Park** (elephants, river safaris), **Okavango Delta** (mokoro trips), **Moremi Game Reserve**, **Makgadikgadi Pans**, **Central Kalahari**, Tsodilo Hills. |
| Egypt (EG) | **Giza** (Pyramids, Sphinx, Grand Egyptian Museum), **Luxor** (Valley of the Kings, Karnak), **Aswan and Abu Simbel**, Nile cruises, **Red Sea** (Hurghada, Sharm), Cairo. |
| Kenya (KE) | Existing Nairobi and Masai Mara; add Amboseli, Diani. |
| Tanzania (TZ) | Serengeti, Ngorongoro, Zanzibar, Kilimanjaro. |
| South Africa (ZA) | Cape Town, Kruger, Garden Route. |
| Ghana (GH) | Existing Accra; add Cape Coast. |
| Morocco, Namibia, Rwanda, Mauritius | Later batch. |

Content rule: I draft summaries and attraction blurbs, **you or the team approve before anything is published.** Photos need licensed or owned images; I will not pull images from the web. Until real photos are uploaded, destinations stay Draft because publishing requires a hero.

## 7. Delivery order

1. **API: data model + public read** — migration 004, entity changes, config, seed, `GET /destinations/{slug}`, tests (Catalogue service). Backfill existing rows as Published.
2. **API: admin endpoints** — CRUD, attractions replace, uploads, publish rules, audit, tests following `AdminPackageServiceTests`.
3. **Regenerate the API client**, then the **public pages**.
4. **Admin screens.**
5. **Content**: seed drafts, you add photos in admin, publish country by country.

Each step is its own branch and PR; the API and web changes land in their own repos.

## 8. Open questions

| #  | Question | My default |
| -- | -------- | ---------- |
| Q1 | Victoria Falls sits on the Zimbabwe–Zambia border. Which country is it filed under? | Zimbabwe, with Zambia mentioned in the text. A destination can have only one parent. |
| Q2 | Do you already have approved photos and descriptions for these places, or should I draft the copy? | I draft the copy, you supply the photos. |
| Q3 | Should a destination page list flights and visas to that country as well as packages? | Packages only for now; flights and visas stay on their own booking pages. |
| Q4 | Does the nav need a dropdown of countries, or does the single `/destinations` link stay? | Single link. |
| Q5 | Who can create and edit destinations: any staff, or SuperAdmin only? | Any signed-in staff, matching packages. |
| Q6 | Is the dev Supabase database fine to run migration 004 against, or is staging the only place for now? | You run it, as with 002 and 003. |
