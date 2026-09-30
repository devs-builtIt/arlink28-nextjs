# Package Enquiries and the Contact Page (Feature Plan)

**Status:** step 1 (API) written 2026-09-30 in `arlink28-api` (entity, service, endpoints, rate limiter, 21 tests passing);
`docs/migrations/001_enquiries.sql` in the API repo was applied to the owner's Supabase dev database on 2026-09-30
(20 columns, 5 indexes, row-level security on). Restart the API to use it.
Steps 2 and 3 (api-client types, `/contact` rebuild, mock API, 15 Playwright tests) and step 4 (admin list and enquiry
screens, 11 Playwright tests) done 2026-09-30. The list item also carries `subject` (added to the API after the plan).
Email added 2026-09-30: each new enquiry is emailed to `EnquirySettings:NotifyTo` (Reply-To is the guest), after it is saved;
a mail failure is logged and never loses the enquiry. SMTP is Google Workspace (`smtp.gmail.com:587`, sender
developers@arlink28.com), set in the API's user-secrets. Google rejected the account password (535-5.7.8), so sending
needs an app password or an approved relay before it works.
Remaining: a working SMTP credential, restart the API, audit against this file with the real API.
Deploy note: the web proxy forwards the guest's address in `X-Forwarded-For` (last entry) so the API's rate limit is per guest;
the reverse proxy in front of the web app must set that header, and the API only trusts it from loopback.
**Spans:** `arlink28-api` (endpoint, table), `arlink28-nextjs/apps/web` (`/contact`, admin list).
**Origin:** the package page's "Enquire about this package" button links to
`/contact?package=Sala%27s+Classic+Safari&checkIn=2026-10-01&nights=3`. The contact page ignores all three values and its form
sends nothing.

See also: [project-public-packages notes in `memory.md`](./memory.md), [ADR 0002](./adr/0002-packages-priced-per-party-per-season.md)
(how a quote is priced).

---

## Decisions (owner, 2026-09-30)

| Question | Decision |
|----------|----------|
| Scope of the first pass | Web + API + an admin list of enquiries |
| Where enquiries go | Stored in the database only. **No email is sent yet.** |
| Notification recipient (later) | One shared inbox, set in API config. Not routed by type. |
| Contact page look | Redesigned. Plain, not AI-looking (see the anti-AI rules in `design.md`). |

Because nothing is emailed, staff only see an enquiry by opening the admin list. That is the main weakness of this first pass and
the first thing to add next (see "Later").

---

## Current state (audited 2026-09-30)

- `BookingCard.tsx` builds the link. `package` is the package **title** (not the slug); `checkIn` and `nights` are added only when
  a quote succeeded.
- `app/(web)/contact/page.tsx` is a static server page: hero, four glass info cards, a form, three side cards, FAQ, newsletter.
- `components/ClientEffects.tsx:52-66` intercepts every `form.contact-form`, logs to the console and calls `form.reset()`. The guest
  sees nothing.
- The enquiry tabs and the FAQ accordion have no handlers that I could find.
- The "Response Times" bars use invented numbers (95%, 100%, 80%, 70%).
- API: `IEmailService` only sends invites and password resets (MailKit/SMTP). There is no enquiry entity or endpoint. `Program.cs`
  registers CORS but **no rate limiter**. The API repo has no migrations.

---

## The flow

```
Package page                      /contact                          API                       Admin
────────────                      ────────                          ───                       ─────
BookingCard quotes a date  ──►  reads package, checkIn, nights
"Enquire" link                  shows "Enquiring about" summary
                                (editable date + nights, live total)
                                guest fills name / email / phone
                                submits ─────────────────────────►  validate, honeypot, rate limit
                                                                    re-quote server-side
                                                                    save Enquiry, write audit_logs
                                shows reference  ◄───────────────  201 { reference }
                                                                                              list of enquiries
                                                                                              status: New → Contacted → Closed
```

1. **Arrive.** The guest lands with `?package=…&checkIn=…&nights=…`. The page shows an "Enquiring about" panel at the top of the
   form: package title, check-in, nights, party, and the quoted total when the date has a price. The guest can change date and
   nights; the total follows (same debounced quote call `BookingCard` uses).
2. **Fill in.** Name, email, phone or WhatsApp (optional), message (optional), consent checkbox. No subject field: the package is
   the subject.
3. **Submit.** `POST /api/v1/enquiries`. The button shows a busy state and is disabled while the request runs.
4. **Confirm.** On success the form is replaced by a confirmation: the reference (for example `ENQ-2026-0042`), what happens next
   ("our team will contact you"), and the WhatsApp/phone fallback. No promised response time until the team agrees one.
5. **Fail.** Field errors show under their fields. A server or network error keeps everything the guest typed and offers retry
   plus the WhatsApp fallback.
6. **Staff.** The enquiry appears in the admin Enquiries list, newest first, status `New`.

### Without a package

`/contact` with no `package` param is a general contact form. It shows a type select (General, Booking help, Partnership, Career,
Investor) and a subject field. Same endpoint, `type` set from the select.

### Edge cases

| Case | Behaviour |
|------|-----------|
| `package` does not match a published package | Treat as a general enquiry; show the title as text only, no summary or quote. |
| `checkIn` in the past, or not `YYYY-MM-DD` | Ignore it; the guest picks a date. |
| `nights` not a number, or below the package's own | Fall back to the package's nights. |
| Date has no rate (`NO_RATE_FOR_DATE`) | Show the same message and covered ranges as `BookingCard`. Submitting is still allowed; the enquiry stores no total. |
| Guest edits the URL to change a price | The API ignores any client total and stores its own quote. |
| Double submit | Button disabled while pending; API returns the existing enquiry for an identical email + package + date within 10 minutes. |
| Bot | Hidden honeypot field filled, or rate limit hit: respond as success without saving (honeypot) or 429 (rate limit). |

The `package` param carries a **title**, which is fragile (titles change, apostrophes and `+` encoding). The plan adds `slug` to
the link as well: `?package=<title>&slug=<slug>`. The page resolves by `slug` and shows the title from the API. The old
`package`-only link keeps working as a general enquiry.

---

## Data

### `Enquiry`

| Column | Type | Notes |
|--------|------|-------|
| `Id` | `uuid` PK | |
| `Reference` | `varchar(20)` | Unique, `ENQ-<year>-<4 digits>`, generated on save |
| `Type` | `varchar(20)` | `Package` \| `General` \| `Booking` \| `Partnership` \| `Career` \| `Investor` |
| `Status` | `varchar(20)` | `New` \| `Contacted` \| `Closed`. Starts `New`. |
| `PackageId` | `uuid?` FK→Package | Null unless `Type = Package` |
| `PackageTitle` | `varchar(200)?` | Copied at submit time so it survives renames |
| `CheckIn` | `date?` | |
| `Nights` | `int?` | |
| `QuotedTotalMinor` | `bigint?` | Server-computed; null when no rate |
| `Currency` | `char(3)?` | |
| `Name` | `varchar(120)` | |
| `Email` | `varchar(200)` | |
| `Phone` | `varchar(40)?` | |
| `Subject` | `varchar(200)?` | General enquiries only |
| `Message` | `varchar(4000)?` | |
| `ConsentAt` | `timestamptz` | When the guest ticked the privacy box |
| `SourceUrl` | `varchar(500)?` | The `/contact?...` URL, for context |
| `CreatedAt` / `UpdatedAt` | `timestamptz` | |
| `HandledById` | `uuid?` FK→Staff | Set when status leaves `New` |

Personal data lives here (name, email, phone). It must follow the retention and privacy notes in `security.md`; decide a
retention period before launch (proposal: delete closed enquiries after 24 months).

---

## API

```
POST   /api/v1/enquiries                       public, rate limited
GET    /api/v1/admin/enquiries                 [Authorize]  ?status=&page=&pageSize=
GET    /api/v1/admin/enquiries/{id}            [Authorize]
PATCH  /api/v1/admin/enquiries/{id}            [Authorize]  { status }
```

**Create request**

```json
{
  "type": "Package",
  "slug": "salas-classic-safari",
  "checkIn": "2026-10-01",
  "nights": 3,
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+254700000000",
  "message": "We are travelling with two children.",
  "consent": true,
  "website": ""
}
```

`website` is the honeypot: a field real guests never see. Anything non-empty is treated as a bot.

**Create response:** `201 { "reference": "ENQ-2026-0042" }`. Errors use the existing RFC 7807 problem details shape with per-field
`errors`, so the web client can show them under each input.

**Rules**
- `name`, `email`, `consent = true` required; `email` format checked; `message` capped at 4000 characters.
- `Type = Package` needs a `slug` of a **Published** package; `checkIn` must be today or later.
- The quote is computed with the same service the public `quote` endpoint uses. If it throws `NO_RATE_FOR_DATE` the enquiry is
  still saved without a total.
- Rate limit: 5 requests per IP per 10 minutes, using ASP.NET Core's built-in `AddRateLimiter` (new to this API).
- Audit: an `audit_logs` row (`Action = "Enquiry.Created"`, no actor) and one for each status change (actor = staff id).
- Admin routes need any signed-in staff role (SuperAdmin or Operator), same as the package admin.

### Feature folders (per ADR 0002)

```
Features/
  Enquiries/
    Controllers/EnquiriesController.cs        public POST
    Controllers/AdminEnquiriesController.cs   list / get / status
    Services/Interfaces/IEnquiryService.cs
    Services/EnquiryService.cs
    RequestModels/CreateEnquiryRequest.cs     + FluentValidation validator
    RequestModels/UpdateEnquiryRequest.cs
    ResponseModels/EnquiryResponses.cs
Data/Entities/Enquiry.cs                      + EnquiryStatus / EnquiryType in Enums.cs
```

The API repo has no migrations, so the table must be created the way the other tables were. Confirm that method before
writing the entity; do not invent a migration setup here.

---

## Web (`apps/web`)

### `/contact` redesign

- **Server page** for content and metadata, with one client component (`EnquiryForm`) for the form. The page reads
  `searchParams` and, when `slug` is present, fetches the package through `utils/server/catalogue.ts` so the summary is
  server-rendered.
- **Layout:** two columns on desktop. Left: the form. Right: direct channels as plain rows (WhatsApp first, then phone, then
  email), office hours, the two addresses. One column on mobile with the form first.
- **Removed:** the response-time bars, the four glass info cards, the marketing hero (replaced by a plain heading), the fake
  form handler.
- **Kept:** the real office hours, addresses, the four department emails, social links, FAQ, newsletter bar.
- **FAQ:** native `<details>`/`<summary>`, so it works without JavaScript.
- **Type select** replaces the tabs. Hidden when arriving with a package.
- **Styles:** new `styles/contact.css` with `.ct-*` classes, matching the public packages look (Outfit, red for primary actions
  only, light content between the dark header and footer). No gradients, glows, fade-up entrances or all-caps eyebrows.
  Don't use `<header>`; the bare `header`/`nav` rules leak (see `memory.md`).
- **Accessibility:** labels on every field, errors linked with `aria-describedby`, focus moves to the confirmation on success,
  `aria-live` on the total.

### Wiring

- `utils/api/enquiries.ts`: `enquiriesApi.create(body)`; `adminEnquiriesApi.list/get/setStatus`.
- Regenerate `packages/api-client` (`openapi.json`, `schema.ts`, `index.ts`) from the running API so types are not hand-written.
- `ClientEffects.tsx`: remove `form.contact-form` from the stub selector. Newsletter and booking forms keep the stub.
- `BookingCard.tsx`: add `slug` to the enquiry link.

### Admin

- `/admin/enquiries`: table (reference, guest, package, dates, total, status, received), status filter, server pagination,
  skeleton loading. Follows the console rules in the packages console design (full width, Stripe-style, Inter).
- Row opens a detail view with the full message, contact details, the quote, and a status control (New → Contacted → Closed).
- Sidebar gets an "Enquiries" link.

---

## Tests

| Layer | What |
|-------|------|
| API (InMemory) | Create valid; missing consent; unpublished slug; past date; no rate saves without total; honeypot; duplicate within 10 min; rate limit; admin list needs auth; status change writes audit |
| Web e2e (Playwright, mock API in `e2e/mock-api.mjs`) | Package page → Enquire → summary shows package/date/nights/total → submit → reference shown; validation errors; server error keeps input; no-package general form; bad params ignored |
| Existing | `public-packages.spec.ts:263` keeps passing (adds `slug` to the URL pattern) |

---

## Milestones

1. **API:** entity, table, service, validator, endpoints, rate limiter, tests. Verify against InMemory, not the remote dev DB.
2. **Client:** regenerate `api-client`; add `enquiriesApi`.
3. **Contact page:** rebuild, styles, prefill, submit, confirmation; remove the stub; e2e.
4. **Admin:** list, detail, status, sidebar link; e2e.
5. **Audit:** review against this file with evidence (screens, test output) before merging.

---

## Later (out of scope now)

- Email the shared inbox on each new enquiry, and a confirmation email to the guest (extend `IEmailService`).
- Notes and assignment on an enquiry; reply from the admin.
- Convert an enquiry into a booking once bookings exist.
- Route notifications by type (support, partners, careers, investors).
- Spam scoring beyond honeypot and rate limit (for example Turnstile) if abuse appears.
- The other contact-adjacent forms (newsletter, booking widget) that still use the stub.

## Open questions

- Retention period for enquiry personal data (24 months proposed).
- Which shared inbox address the later email goes to.
- Whether the guest should get a confirmation email once email exists (recommended).
