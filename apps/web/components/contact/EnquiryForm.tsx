"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import type { CreateEnquiryRequest, Quote } from "@arlink28/api-client";
import { ApiError } from "@/utils/api/client";
import { enquiriesApi } from "@/utils/api/enquiries";
import { packagesApi } from "@/utils/api/packages";
import { nightsLabel, partyLabel, priceLabel } from "@/utils/packages";
import { PUBLIC, isPublicType } from "@/utils/publicProducts";

import { GENERAL_TYPES, type EnquiryPackage, type GeneralType } from "./types";

type Props = {
  /** The published package the guest came from, or null for a general enquiry. */
  pkg: EnquiryPackage | null;
  /** The title from a link whose package can't be found; shown as plain text and put in the subject. */
  aboutTitle: string | null;
  initialCheckIn: string;
  initialNights: number | null;
  initialType: GeneralType;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isoToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

type Field = "name" | "email" | "phone" | "subject" | "message" | "consent" | "checkIn";
type Errors = Partial<Record<Field, string>>;

/** The API names fields as C# properties ("Email"); the form uses lower camel case. */
function fieldFromServer(key: string): Field | null {
  const name = key.charAt(0).toLowerCase() + key.slice(1);
  return ["name", "email", "phone", "subject", "message", "consent", "checkIn"].includes(name) ? (name as Field) : null;
}

export default function EnquiryForm({ pkg, aboutTitle, initialCheckIn, initialNights, initialType }: Props) {
  const [type, setType] = useState<GeneralType>(initialType);
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [nights, setNights] = useState(initialNights ?? (pkg?.nights || 1));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState(aboutTitle ? `Enquiry about ${aboutTitle}` : "");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [trap, setTrap] = useState("");

  const [errors, setErrors] = useState<Errors>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [reference, setReference] = useState<string | null>(null);

  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteNote, setQuoteNote] = useState<string | null>(null);
  const latest = useRef(0);
  const done = useRef<HTMLDivElement>(null);
  const form = useRef<HTMLFormElement>(null);

  const charter = pkg?.kind === "PrivateCharter";
  const holiday = pkg === null || (!isPublicType(pkg.kind) && !charter);
  const more = charter
    ? { path: "/elite-jets", plural: "Elite tiers" }
    : pkg && isPublicType(pkg.kind)
      ? PUBLIC[pkg.kind]
      : { path: "/packages", plural: "packages" };

  // The price follows the date and length the guest picks, from the same rules the package page uses.
  useEffect(() => {
    // Only holiday packages have season rates to quote from.
    if (!pkg || !holiday || !/^\d{4}-\d{2}-\d{2}$/.test(checkIn) || checkIn < isoToday()) {
      setQuote(null);
      setQuoteNote(null);
      return;
    }
    const request = ++latest.current;
    const timer = setTimeout(() => {
      packagesApi
        .quote(pkg.slug, { checkIn, nights })
        .then((result) => {
          if (request !== latest.current) return;
          setQuote(result);
          setQuoteNote(null);
        })
        .catch((err) => {
          if (request !== latest.current) return;
          setQuote(null);
          setQuoteNote(
            err instanceof ApiError && err.code === "NO_RATE_FOR_DATE"
              ? "We have no online price for that date. Send the enquiry and we will price it for you."
              : err instanceof Error
                ? err.message
                : "The price couldn't be worked out.",
          );
        });
    }, 250);
    return () => clearTimeout(timer);
  }, [pkg, holiday, checkIn, nights]);

  useEffect(() => {
    if (reference) done.current?.focus();
  }, [reference]);

  const isPackage = pkg !== null;

  function validate(): Errors {
    const found: Errors = {};
    if (!name.trim()) found.name = "Enter your name.";
    if (!email.trim()) found.email = "Enter your email address.";
    else if (!EMAIL.test(email.trim())) found.email = "Enter a valid email address, like you@example.com.";
    if (!isPackage && !subject.trim()) found.subject = "Say what this is about.";
    if (!isPackage && !message.trim()) found.message = "Tell us a little more.";
    if (checkIn && checkIn < isoToday()) found.checkIn = "Choose a date that has not passed.";
    if (!consent) found.consent = "Please agree so we can contact you.";
    return found;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFailure(null);
    const found = validate();
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      form.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    const body: CreateEnquiryRequest = {
      type: isPackage ? "Package" : type,
      slug: pkg?.slug ?? null,
      checkIn: isPackage && checkIn ? checkIn : null,
      nights: isPackage && checkIn && (holiday || pkg?.kind === "HotelReservation") ? nights : null,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || null,
      subject: isPackage ? null : subject.trim(),
      message: message.trim() || null,
      consent,
      sourceUrl: `${window.location.pathname}${window.location.search}`,
      website: trap,
    };

    setSending(true);
    try {
      const result = await enquiriesApi.create(body);
      setReference(result.reference);
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) {
        const server: Errors = {};
        for (const [key, messages] of Object.entries(err.fieldErrors)) {
          const field = fieldFromServer(key);
          if (field && messages[0]) server[field] = messages[0];
        }
        if (Object.keys(server).length > 0) {
          setErrors(server);
          setSending(false);
          return;
        }
      }
      setFailure(
        err instanceof ApiError
          ? err.message
          : "We couldn't send your enquiry. Check your connection and try again, or call us.",
      );
    }
    setSending(false);
  }

  if (reference) {
    return (
      <div className="ct-done" ref={done} tabIndex={-1} role="status">
        <h2>We have your enquiry</h2>
        <p>Your reference is</p>
        <span className="ct-reference">{reference}</span>
        <p>
          Our team will contact you at <strong>{email.trim()}</strong>. If it is urgent, call us and quote the
          reference.
        </p>
        <div className="ct-actions">
          <Link className="ct-button ct-button-plain" href={more.path}>
            Browse more {more.plural}
          </Link>
        </div>
      </div>
    );
  }

  const minToday = isoToday();
  const err = (field: Field) => errors[field];
  const described = (field: Field) => (err(field) ? `ct-${field}-error` : undefined);

  return (
    <form className="ct-form" ref={form} onSubmit={submit} noValidate aria-label="Enquiry form">
      {pkg && (
        <div className="ct-about">
          <p className="ct-about-label">You are enquiring about</p>
          <p className="ct-about-title">
            <Link href={pkg.path}>{pkg.title}</Link>
          </p>
          {(holiday || pkg.summary) && (
            <p className="ct-about-meta">
              {holiday ? `${partyLabel(pkg.adults, pkg.children)}, ${nightsLabel(nights)}` : pkg.summary}
            </p>
          )}
          <div className="ct-about-fields">
            {pkg.kind !== "VisaSupport" && (
              <div className="ct-field">
                <label htmlFor="ct-checkin">
                  {holiday || pkg.kind === "HotelReservation" ? "Check-in date" : "Preferred travel date"}
                </label>
                <input
                  id="ct-checkin"
                  name="checkIn"
                  type="date"
                  value={checkIn}
                  min={minToday}
                  onChange={(e) => setCheckIn(e.target.value)}
                  aria-invalid={err("checkIn") ? true : undefined}
                  aria-describedby={described("checkIn")}
                />
                {err("checkIn") && (
                  <p className="ct-error" id="ct-checkIn-error">
                    {err("checkIn")}
                  </p>
                )}
              </div>
            )}
            {pkg.kind === "HotelReservation" && (
              <div className="ct-field">
                <label htmlFor="ct-nights">Nights</label>
                <select id="ct-nights" value={nights} onChange={(e) => setNights(Number(e.target.value))}>
                  {Array.from({ length: 21 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {nightsLabel(n)}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {holiday && pkg.extraNightsSold && (
              <div className="ct-field">
                <label htmlFor="ct-nights">Nights</label>
                <select id="ct-nights" value={nights} onChange={(e) => setNights(Number(e.target.value))}>
                  {Array.from({ length: 8 }, (_, i) => pkg.nights + i).map((n) => (
                    <option key={n} value={n}>
                      {nightsLabel(n)}
                      {n === pkg.nights ? " (as packaged)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {quote && (
            <p className="ct-about-total" aria-live="polite">
              <span>Price for these dates</span>
              <strong>{priceLabel(quote.totalMinor, quote.currency)}</strong>
            </p>
          )}
          {quoteNote && (
            <p className="ct-about-note" aria-live="polite">
              {quoteNote}
            </p>
          )}
          <p className="ct-about-note">
            {holiday
              ? "Nothing is charged online. Our team confirms the details with you."
              : "Nothing is charged online. Our team sends you a price and the next steps."}
          </p>
        </div>
      )}

      {!pkg && aboutTitle && (
        <div className="ct-about">
          <p className="ct-about-label">You are enquiring about</p>
          <p className="ct-about-title">{aboutTitle}</p>
          <p className="ct-about-note">
            We couldn&apos;t find that package online. Tell us what you would like and we will help.
          </p>
        </div>
      )}

      {!pkg && (
        <div className="ct-field">
          <label htmlFor="ct-type">What is this about?</label>
          <select id="ct-type" value={type} onChange={(e) => setType(e.target.value as GeneralType)}>
            {GENERAL_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="ct-row">
        <div className="ct-field">
          <label htmlFor="ct-name">Your name</label>
          <input
            id="ct-name"
            name="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={err("name") ? true : undefined}
            aria-describedby={described("name")}
          />
          {err("name") && (
            <p className="ct-error" id="ct-name-error">
              {err("name")}
            </p>
          )}
        </div>
        <div className="ct-field">
          <label htmlFor="ct-email">Email address</label>
          <input
            id="ct-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={err("email") ? true : undefined}
            aria-describedby={described("email")}
          />
          {err("email") && (
            <p className="ct-error" id="ct-email-error">
              {err("email")}
            </p>
          )}
        </div>
      </div>

      <div className="ct-field">
        <label htmlFor="ct-phone">
          Phone number <span className="ct-optional">(optional)</span>
        </label>
        <input
          id="ct-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+234 800 000 0000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          aria-invalid={err("phone") ? true : undefined}
          aria-describedby={described("phone")}
        />
        {err("phone") && (
          <p className="ct-error" id="ct-phone-error">
            {err("phone")}
          </p>
        )}
      </div>

      {!isPackage && (
        <div className="ct-field">
          <label htmlFor="ct-subject">Subject</label>
          <input
            id="ct-subject"
            name="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            aria-invalid={err("subject") ? true : undefined}
            aria-describedby={described("subject")}
          />
          {err("subject") && (
            <p className="ct-error" id="ct-subject-error">
              {err("subject")}
            </p>
          )}
        </div>
      )}

      <div className="ct-field">
        <label htmlFor="ct-message">Message {isPackage && <span className="ct-optional">(optional)</span>}</label>
        <textarea
          id="ct-message"
          name="message"
          rows={5}
          placeholder={isPackage ? "Who is travelling, and anything we should know." : undefined}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          aria-invalid={err("message") ? true : undefined}
          aria-describedby={described("message")}
        />
        {err("message") && (
          <p className="ct-error" id="ct-message-error">
            {err("message")}
          </p>
        )}
      </div>

      {/* Bots fill every field. People never see this one. */}
      <div className="ct-trap" aria-hidden="true">
        <label htmlFor="ct-website">Website</label>
        <input
          id="ct-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={trap}
          onChange={(e) => setTrap(e.target.value)}
        />
      </div>

      <div className="ct-field">
        <div className="ct-consent">
          <input
            id="ct-consent"
            name="consent"
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            aria-invalid={err("consent") ? true : undefined}
            aria-describedby={described("consent")}
          />
          <label htmlFor="ct-consent">
            I agree to the <Link href="/privacy-policy">privacy policy</Link> and to being contacted about this enquiry.
          </label>
        </div>
        {err("consent") && (
          <p className="ct-error" id="ct-consent-error">
            {err("consent")}
          </p>
        )}
      </div>

      {failure && (
        <p className="ct-alert" role="alert">
          {failure} You can also call us.
        </p>
      )}

      <div className="ct-actions">
        <button type="submit" className="ct-button" disabled={sending}>
          {sending ? "Sending…" : isPackage ? "Send enquiry" : "Send message"}
        </button>
      </div>
    </form>
  );
}
