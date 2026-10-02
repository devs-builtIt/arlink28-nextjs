"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { CreateEnquiryRequest } from "@arlink28/api-client";
import { ApiError } from "@/utils/api/client";
import { enquiriesApi } from "@/utils/api/enquiries";
import { track } from "@/utils/track";
import { WHATSAPP_URL } from "@/content/home-proof";
import Dropdown, { PARTY_SIZES } from "./Dropdown";

const SERVICES = ["Flight", "Hotel reservation", "Visa support", "Holiday package", "Private charter"] as const;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Field = "name" | "email" | "service" | "destination" | "consent";

/** The full quote form for the Get a quote page: one screen, every field visible. */
export default function QuoteForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [service, setService] = useState("");
  const [destination, setDestination] = useState("");
  const [travellers, setTravellers] = useState(PARTY_SIZES[0].value);
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [trap, setTrap] = useState("");

  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const started = useRef(false);
  const form = useRef<HTMLFormElement>(null);
  const done = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reference) done.current?.focus();
  }, [reference]);

  const begin = () => {
    if (started.current) return;
    started.current = true;
    track("quote_started", { product: "quote_page" });
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFailure(null);
    const found: Partial<Record<Field, string>> = {};
    if (!name.trim()) found.name = "Enter your name.";
    if (!email.trim()) found.email = "Enter your email address.";
    else if (!EMAIL.test(email.trim())) found.email = "Enter a valid email address, like you@example.com.";
    if (!service) found.service = "Choose a service.";
    if (!destination.trim()) found.destination = "Tell us where you want to go.";
    if (!consent) found.consent = "Please agree so we can contact you.";
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      track("quote_error", { product: "quote_page", field: first });
      form.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    const lines = [`Service: ${service}`, `Destination: ${destination.trim()}`, `Travellers: ${travellers}`];
    if (message.trim()) lines.push("", message.trim());
    const body: CreateEnquiryRequest = {
      type: "Booking",
      checkIn: null,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || null,
      subject: `${service} quote: ${destination.trim()}`,
      message: lines.join("\n"),
      consent,
      sourceUrl: `${window.location.pathname}${window.location.search}`,
      website: trap,
    };

    setSending(true);
    try {
      const result = await enquiriesApi.create(body);
      track("quote_submitted", { product: "quote_page" });
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
      <div className="qf qf-done" ref={done} tabIndex={-1} role="status">
        <h2>Reference {reference}</h2>
        <p>
          We will reply to <strong>{email.trim()}</strong> with options and a price. For anything urgent, message us on
          WhatsApp and quote the reference.
        </p>
        <a className="hm-btn hm-btn-quiet" href={chat} target="_blank" rel="noopener noreferrer">
          <i className="fa-brands fa-whatsapp" aria-hidden="true"></i>
          Message us on WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form className="qf" ref={form} onSubmit={submit} onFocus={begin} noValidate aria-label="Get a quote">
      <div className="qf-grid">
        <div className="qf-field">
          <label htmlFor="qf-name">Name</label>
          <input
            id="qf-name"
            name="name"
            autoComplete="name"
            placeholder="Your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={errors.name ? true : undefined}
          />
          {errors.name && <p className="qf-error">{errors.name}</p>}
        </div>
        <div className="qf-field">
          <label htmlFor="qf-phone">Phone number</label>
          <input
            id="qf-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+234 000 000 0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className="qf-field">
          <label htmlFor="qf-email">Email address</label>
          <input
            id="qf-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={errors.email ? true : undefined}
          />
          {errors.email && <p className="qf-error">{errors.email}</p>}
        </div>
        <div className="qf-field">
          <label htmlFor="qf-service">Service</label>
          <Dropdown
            id="qf-service"
            name="service"
            value={service}
            onChange={setService}
            placeholder="Choose a service"
            options={SERVICES.map((v) => ({ value: v, label: v }))}
            invalid={!!errors.service}
          />
          {errors.service && <p className="qf-error">{errors.service}</p>}
        </div>
        <div className="qf-field">
          <label htmlFor="qf-destination">Travel destination</label>
          <input
            id="qf-destination"
            name="destination"
            placeholder="Where do you want to go?"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            aria-invalid={errors.destination ? true : undefined}
          />
          {errors.destination && <p className="qf-error">{errors.destination}</p>}
        </div>
        <div className="qf-field">
          <label htmlFor="qf-travellers">Number of travellers</label>
          <Dropdown
            id="qf-travellers"
            name="travellers"
            value={travellers}
            onChange={setTravellers}
            options={PARTY_SIZES}
          />
        </div>
        <div className="qf-field qf-wide">
          <label htmlFor="qf-message">Your message</label>
          <textarea
            id="qf-message"
            name="message"
            rows={5}
            placeholder="Dates, airports, budget, or anything else we should know."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
      </div>

      {/* Hidden from people; bots tend to fill it, and the API ignores those requests. */}
      <div className="qf-trap" aria-hidden="true">
        <label htmlFor="qf-website">Website</label>
        <input
          id="qf-website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={trap}
          onChange={(e) => setTrap(e.target.value)}
        />
      </div>

      <div className="qf-consent">
        <input
          id="qf-consent"
          name="consent"
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          aria-invalid={errors.consent ? true : undefined}
        />
        <label htmlFor="qf-consent">
          I agree that ARLink28 may contact me about this request, as set out in the{" "}
          <a href="/privacy-policy">privacy policy</a>.
        </label>
      </div>
      {errors.consent && <p className="qf-error">{errors.consent}</p>}
      {failure && (
        <p className="qf-error" role="alert">
          {failure}
        </p>
      )}
      <button type="submit" className="hm-btn hm-btn-dark" disabled={sending}>
        {sending ? "Sending..." : "Send my request"}
      </button>
    </form>
  );
}
