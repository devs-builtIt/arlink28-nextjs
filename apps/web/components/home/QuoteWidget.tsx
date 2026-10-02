"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { CreateEnquiryRequest } from "@arlink28/api-client";
import { ApiError } from "@/utils/api/client";
import { enquiriesApi } from "@/utils/api/enquiries";
import { track } from "@/utils/track";
import { WHATSAPP_URL } from "@/content/home-proof";
import Dropdown from "./Dropdown";
import AirportField, { airportLabel, findAirport } from "./AirportField";

type Kind = "Flight" | "Hotel" | "Visa" | "Holiday";
const KINDS: Kind[] = ["Flight", "Hotel", "Visa", "Holiday"];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isoToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

type Errors = Partial<Record<"from" | "to" | "place" | "name" | "email" | "consent" | "depart", string>>;

export const ROUTE_EVENT = "arlink:route";
export type RouteDetail = { from: string; to: string };

/** The hero's quote request. Two short steps: what you need, then who to send it to. */
export default function QuoteWidget() {
  const [kind, setKind] = useState<Kind>("Flight");
  const [step, setStep] = useState<1 | 2>(1);

  const [oneWay, setOneWay] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [depart, setDepart] = useState("");
  const [back, setBack] = useState("");
  const [travellers, setTravellers] = useState(1);
  // Hotel, visa and holiday share one "where".
  const [place, setPlace] = useState("");
  const [nationality, setNationality] = useState("");
  const [nights, setNights] = useState(3);
  const [notes, setNotes] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [trap, setTrap] = useState("");

  const [errors, setErrors] = useState<Errors>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const started = useRef(false);
  const root = useRef<HTMLDivElement>(null);
  const done = useRef<HTMLDivElement>(null);
  const departInput = useRef<HTMLInputElement>(null);

  // A route chosen further down the page fills in the form and brings it into view.
  useEffect(() => {
    const onRoute = (e: Event) => {
      const { from: a, to: b } = (e as CustomEvent<RouteDetail>).detail;
      const origin = findAirport(a);
      const dest = findAirport(b);
      setKind("Flight");
      setStep(1);
      setReference(null);
      if (origin) setFrom(airportLabel(origin));
      if (dest) setTo(airportLabel(dest));
      root.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => departInput.current?.focus({ preventScroll: true }), 450);
    };
    window.addEventListener(ROUTE_EVENT, onRoute);
    return () => window.removeEventListener(ROUTE_EVENT, onRoute);
  }, []);

  useEffect(() => {
    if (reference) done.current?.focus();
  }, [reference]);

  const begin = () => {
    if (started.current) return;
    started.current = true;
    track("quote_started", { product: kind });
  };

  const pick = (next: Kind) => {
    setKind(next);
    setErrors({});
    setFailure(null);
    setStep(1);
  };

  const today = isoToday();

  function validateStep1(): Errors {
    const found: Errors = {};
    if (kind === "Flight") {
      if (!from.trim()) found.from = "Where are you flying from?";
      if (!to.trim()) found.to = "Where to?";
    } else if (!place.trim()) {
      found.place = kind === "Visa" ? "Which country do you need a visa for?" : "Where are you going?";
    }
    if (depart && depart < today) found.depart = "Choose a date that has not passed.";
    return found;
  }

  function next(e: FormEvent) {
    e.preventDefault();
    const found = validateStep1();
    setErrors(found);
    if (Object.keys(found).length === 0) setStep(2);
    else track("quote_error", { product: kind, field: Object.keys(found)[0] });
  }

  function describe(): { subject: string; message: string } {
    const lines: string[] = [];
    let subject: string;
    if (kind === "Flight") {
      subject = `Flight quote: ${from.trim()} to ${to.trim()}`;
      lines.push(`Trip: ${oneWay ? "One way" : "Return"}`, `From: ${from.trim()}`, `To: ${to.trim()}`);
      if (depart) lines.push(`Depart: ${depart}`);
      if (!oneWay && back) lines.push(`Return: ${back}`);
      lines.push(`Travellers: ${travellers}`);
    } else if (kind === "Hotel") {
      subject = `Hotel quote: ${place.trim()}`;
      lines.push(`Destination: ${place.trim()}`);
      if (depart) lines.push(`Check in: ${depart}`);
      lines.push(`Nights: ${nights}`, `Guests: ${travellers}`);
    } else if (kind === "Visa") {
      subject = `Visa support: ${place.trim()}`;
      lines.push(`Visa for: ${place.trim()}`);
      if (nationality.trim()) lines.push(`Nationality: ${nationality.trim()}`);
      if (depart) lines.push(`Travel date: ${depart}`);
    } else {
      subject = `Holiday quote: ${place.trim()}`;
      lines.push(`Destination: ${place.trim()}`);
      if (depart) lines.push(`Travel from: ${depart}`);
      lines.push(`Nights: ${nights}`, `Travellers: ${travellers}`);
    }
    if (notes.trim()) lines.push("", notes.trim());
    return { subject, message: lines.join("\n") };
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFailure(null);
    const found: Errors = {};
    if (!name.trim()) found.name = "Enter your name.";
    if (!email.trim()) found.email = "Enter your email address.";
    else if (!EMAIL.test(email.trim())) found.email = "Enter a valid email address, like you@example.com.";
    if (!consent) found.consent = "Please agree so we can contact you.";
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      track("quote_error", { product: kind, field: first });
      root.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    const { subject, message } = describe();
    const body: CreateEnquiryRequest = {
      type: "Booking",
      checkIn: depart && depart >= today ? depart : null,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || null,
      subject,
      message,
      consent,
      sourceUrl: `${window.location.pathname}${window.location.search}`,
      website: trap,
    };

    setSending(true);
    try {
      const result = await enquiriesApi.create(body);
      track("quote_submitted", { product: kind });
      setReference(result.reference);
    } catch (err) {
      setFailure(
        err instanceof ApiError
          ? err.message
          : "We couldn't send that. Check your connection and try again, or message us on WhatsApp.",
      );
    }
    setSending(false);
  }

  if (reference) {
    const chat = `${WHATSAPP_URL}?text=${encodeURIComponent(`Hello, my quote reference is ${reference}.`)}`;
    return (
      <div className="hm-quote hm-glass" ref={root} id="quote">
        <div className="hm-done" ref={done} tabIndex={-1} role="status">
          <p className="hm-eyebrow">Request received</p>
          <h2>Reference {reference}</h2>
          <p>
            We will reply to <strong>{email.trim()}</strong> with options and a price. For anything urgent, message us
            on WhatsApp and quote the reference.
          </p>
          <div className="hm-actions">
            <a
              className="hm-btn hm-btn-primary"
              href={chat}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("whatsapp_click", { placement: "quote_done" })}
            >
              Continue on WhatsApp
            </a>
            <button
              type="button"
              className="hm-btn hm-btn-quiet"
              onClick={() => {
                setReference(null);
                setStep(1);
                setConsent(false);
                started.current = false;
              }}
            >
              Start another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hm-quote hm-glass" ref={root} id="quote">
      <div className="hm-seg" role="radiogroup" aria-label="What do you need?">
        {KINDS.map((k) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={kind === k}
            className={kind === k ? "is-on" : undefined}
            onClick={() => pick(k)}
          >
            {k}
          </button>
        ))}
      </div>

      {step === 1 ? (
        <form className="hm-form" onSubmit={next} onChange={begin} noValidate aria-label={`${kind} quote request`}>
          {kind === "Flight" ? (
            <>
              <div className="hm-trip" role="radiogroup" aria-label="Trip type">
                <button
                  type="button"
                  role="radio"
                  aria-checked={!oneWay}
                  className={!oneWay ? "is-on" : undefined}
                  onClick={() => setOneWay(false)}
                >
                  Return
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={oneWay}
                  className={oneWay ? "is-on" : undefined}
                  onClick={() => setOneWay(true)}
                >
                  One way
                </button>
              </div>
              <div className="hm-row hm-row-2">
                <AirportField
                  name="from"
                  label="From"
                  value={from}
                  onChange={setFrom}
                  placeholder="City or airport"
                  error={errors.from}
                />
                <AirportField
                  name="to"
                  label="To"
                  value={to}
                  onChange={setTo}
                  placeholder="City or airport"
                  error={errors.to}
                />
              </div>
            </>
          ) : (
            <div className="hm-field">
              <label htmlFor="hm-place">{kind === "Visa" ? "Visa for which country?" : "Where to?"}</label>
              <input
                id="hm-place"
                name="place"
                type="text"
                autoComplete="off"
                placeholder={kind === "Hotel" ? "City or hotel" : kind === "Visa" ? "Country" : "Destination"}
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                aria-invalid={errors.place ? true : undefined}
              />
              {errors.place && <p className="hm-error">{errors.place}</p>}
            </div>
          )}

          <div className={`hm-row ${kind === "Flight" && !oneWay ? "hm-row-3" : "hm-row-2"}`}>
            <div className="hm-field">
              <label htmlFor="hm-depart">
                {kind === "Flight"
                  ? "Depart"
                  : kind === "Visa"
                    ? "Travel date"
                    : kind === "Hotel"
                      ? "Check in"
                      : "From"}
              </label>
              <input
                id="hm-depart"
                name="depart"
                type="date"
                min={today}
                value={depart}
                ref={departInput}
                onChange={(e) => setDepart(e.target.value)}
                aria-invalid={errors.depart ? true : undefined}
              />
              {errors.depart && <p className="hm-error">{errors.depart}</p>}
            </div>
            {kind === "Flight" && !oneWay && (
              <div className="hm-field">
                <label htmlFor="hm-back">Return</label>
                <input
                  id="hm-back"
                  name="back"
                  type="date"
                  min={depart || today}
                  value={back}
                  onChange={(e) => setBack(e.target.value)}
                />
              </div>
            )}
            {kind === "Visa" ? (
              <div className="hm-field">
                <label htmlFor="hm-nat">Your nationality</label>
                <input
                  id="hm-nat"
                  name="nationality"
                  type="text"
                  autoComplete="off"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            ) : (
              <div className="hm-field">
                <label htmlFor="hm-trav">{kind === "Hotel" ? "Guests" : "Travellers"}</label>
                <Dropdown
                  id="hm-trav"
                  name="travellers"
                  value={String(travellers)}
                  onChange={(v) => setTravellers(Number(v))}
                  options={[
                    ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => ({ value: String(n), label: String(n) })),
                    { value: "10", label: "10 or more" },
                  ]}
                />
              </div>
            )}
          </div>

          {(kind === "Hotel" || kind === "Holiday") && (
            <div className="hm-field">
              <label htmlFor="hm-nights">Nights</label>
              <Dropdown
                id="hm-nights"
                name="nights"
                value={String(nights)}
                onChange={(v) => setNights(Number(v))}
                options={[1, 2, 3, 4, 5, 6, 7, 10, 14].map((n) => ({ value: String(n), label: String(n) }))}
              />
            </div>
          )}

          <button type="submit" className="hm-btn hm-btn-primary">
            Get my quote
          </button>
        </form>
      ) : (
        <form className="hm-form" onSubmit={submit} noValidate aria-label="Your contact details">
          <button type="button" className="hm-back" onClick={() => setStep(1)}>
            Back to trip details
          </button>
          <p className="hm-summary">{describe().subject}</p>
          <div className="hm-row hm-row-2">
            <div className="hm-field">
              <label htmlFor="hm-name">Your name</label>
              <input
                id="hm-name"
                name="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={errors.name ? true : undefined}
              />
              {errors.name && <p className="hm-error">{errors.name}</p>}
            </div>
            <div className="hm-field">
              <label htmlFor="hm-phone">WhatsApp or phone</label>
              <input
                id="hm-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>
          <div className="hm-field">
            <label htmlFor="hm-email">Email</label>
            <input
              id="hm-email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={errors.email ? true : undefined}
            />
            {errors.email && <p className="hm-error">{errors.email}</p>}
          </div>
          <div className="hm-field">
            <label htmlFor="hm-notes">Anything we should know?</label>
            <textarea
              id="hm-notes"
              name="notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional: baggage, flexible dates, preferred airline"
            />
          </div>
          {/* A trap for bots: people never see it, so only a script fills it in. */}
          <div className="hm-trap" aria-hidden="true">
            <label>
              Website
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={trap}
                onChange={(e) => setTrap(e.target.value)}
              />
            </label>
          </div>
          <div className="hm-check">
            <input
              id="hm-consent"
              name="consent"
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              aria-invalid={errors.consent ? true : undefined}
            />
            <label htmlFor="hm-consent">
              I agree that ARLink28 may contact me about this request, as set out in the{" "}
              <a href="/privacy-policy">privacy policy</a>.
            </label>
          </div>
          {errors.consent && <p className="hm-error">{errors.consent}</p>}
          {failure && (
            <p className="hm-failure" role="alert">
              {failure}
            </p>
          )}
          <button type="submit" className="hm-btn hm-btn-primary" disabled={sending}>
            {sending ? "Sending..." : "Send my request"}
          </button>
        </form>
      )}
      <ul className="hm-quote-assure">
        <li>No payment until you agree</li>
        <li>Secure payment, 100% guaranteed</li>
        <li>24/7 travel support</li>
      </ul>
    </div>
  );
}
