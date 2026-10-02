import type { Metadata } from "next";
import EnquiryForm from "@/components/contact/EnquiryForm";
import { GENERAL_TYPES, type EnquiryPackage, type GeneralType } from "@/components/contact/types";
import { headline, publicPath } from "@/utils/publicProducts";
import { getPackage } from "@/utils/server/catalogue";
import "../styles/contact.css";

export const metadata: Metadata = {
  title: "Contact | ARLink28",
  description:
    "Ask about a safari package, a booking, a partnership or a career. Send an enquiry or message ARLink28 on WhatsApp.",
};

type Search = { searchParams: { [key: string]: string | string[] | undefined } };

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

const FAQ = [
  {
    q: "How do I book a flight with ARLinks?",
    a: "Send a quote request from the homepage with your route and dates. A member of our team replies with options and a price, and books it once you agree.",
  },
  {
    q: "Can I change or cancel my booking?",
    a: "Yes. Contact our support team via phone or email with your booking reference. Changes and cancellations are subject to the airline's individual policy. Our team will guide you through the process and any applicable fees.",
  },
  {
    q: "How do I apply for a career opportunity?",
    a: 'Visit our Opportunities page to see current openings. Click "Apply Now" on your preferred role and send us a message here, choosing "Career" and naming the role. We aim to respond to all applications within 5 business days.',
  },
  {
    q: "How can I invest in or partner with ARLink28?",
    a: 'Use the form on this page and choose "Investor" or "Partnership", or email partners@arlink28.com. We\'ll arrange a private briefing and share our investor deck within 72 hours of your enquiry.',
  },
  {
    q: "Does ARLinks offer group booking discounts?",
    a: "Yes. For groups of 10 or more passengers, we offer preferential pricing and dedicated booking support. Contact our team directly and we'll prepare a tailored group quote within 24 hours.",
  },
];

export default async function ContactPage({ searchParams }: Search) {
  const slug = one(searchParams.slug)?.trim();
  const title = one(searchParams.package)?.trim();
  const today = new Date().toISOString().slice(0, 10);

  const detail = slug ? await getPackage(slug).catch(() => null) : null;
  const pkg: EnquiryPackage | null = detail && {
    slug: detail.slug,
    title: detail.title,
    kind: detail.productType,
    path: publicPath(detail.productType, detail.slug),
    summary: headline(detail.productType, detail.details)?.replace(detail.title, "").trim() ?? "",
    nights: detail.nights,
    adults: detail.adults,
    children: detail.children,
    extraNightsSold: detail.rates.some((r) => r.extraNightPriceMinor != null),
  };
  // A link whose package no longer exists still says what the guest was looking at.
  const aboutTitle = pkg ? null : title || null;

  const rawCheckIn = one(searchParams.checkIn) ?? "";
  const checkIn = /^\d{4}-\d{2}-\d{2}$/.test(rawCheckIn) && rawCheckIn >= today ? rawCheckIn : "";
  const rawNights = Number(one(searchParams.nights));
  const nights = Number.isInteger(rawNights) && rawNights >= 1 && rawNights <= 60 ? rawNights : null;
  const asked = one(searchParams.type)?.toLowerCase();
  const initialType: GeneralType = GENERAL_TYPES.find((t) => t.value.toLowerCase() === asked)?.value ?? "General";

  return (
    <>
      <div className="ct-top">
        <h1>Contact us</h1>
        <p>
          {pkg
            ? `Tell us who you are and we will come back to you about this ${pkg.kind === "HolidayPackage" ? "package" : "request"}.`
            : "Ask about a package, a booking, a partnership or a role. Send a message here, or reach us on WhatsApp."}
        </p>
      </div>

      <div className="ct-page">
        <div className="ct-layout">
          <section className="ct-card" id="form" aria-labelledby="ct-form-title">
            <h2 id="ct-form-title">{pkg ? "Send an enquiry" : "Send a message"}</h2>
            <p className="ct-card-lead">
              {pkg
                ? "We will confirm dates, availability and the price with you. Nothing is charged online."
                : "We reply by email, usually within one business day."}
            </p>
            <EnquiryForm
              pkg={pkg}
              aboutTitle={aboutTitle}
              initialCheckIn={pkg ? checkIn : ""}
              initialNights={pkg ? nights : null}
              initialType={initialType}
            />
          </section>

          <aside className="ct-aside" aria-label="Other ways to reach us">
            <div className="ct-card">
              <h2>Talk to us</h2>
              <ul className="ct-list ct-list-lead">
                <li>
                  <span>WhatsApp</span>
                  <a href="https://wa.me/2347047009128">+234 704 700 9128</a>
                </li>
                <li>
                  <span>Phone, Nigeria</span>
                  <a href="tel:+2347047009128">+234 704 700 9128</a>
                </li>
                <li>
                  <span>Phone, United Kingdom</span>
                  <a href="tel:+447539071257">+44 753 907 1257</a>
                </li>
              </ul>
            </div>

            <div className="ct-card">
              <h2>Email</h2>
              <ul className="ct-list">
                <li>
                  <span>Bookings and support</span>
                  <a href="mailto:support@arlinks.com">support@arlinks.com</a>
                </li>
                <li>
                  <span>Partnerships</span>
                  <a href="mailto:partners@arlink28.com">partners@arlink28.com</a>
                </li>
                <li>
                  <span>Investors</span>
                  <a href="mailto:investors@arlink28.com">investors@arlink28.com</a>
                </li>
                <li>
                  <span>Careers</span>
                  <a href="mailto:careers@arlink28.com">careers@arlink28.com</a>
                </li>
              </ul>
            </div>

            <div className="ct-card">
              <h2>Support hours</h2>
              <dl className="ct-hours">
                <div>
                  <dt>Monday to Friday</dt>
                  <dd>08:00 to 20:00 WAT</dd>
                </div>
                <div>
                  <dt>Saturday</dt>
                  <dd>09:00 to 18:00 WAT</dd>
                </div>
                <div>
                  <dt>Sunday</dt>
                  <dd>Urgent support only</dd>
                </div>
                <div>
                  <dt>Emergency line</dt>
                  <dd>24 hours</dd>
                </div>
              </dl>
            </div>

            <div className="ct-card">
              <h2>Offices</h2>
              <div className="ct-offices">
                <p>2nd Floor, Office 316B, Mulliner Towers, 39 Alfred Rewane Road, Ikoyi, Lagos, Nigeria 101233</p>
                <p>71–75 Shelton Street, Covent Garden, London WC2H 9JQ, United Kingdom</p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <section className="ct-faq" id="faq" aria-labelledby="ct-faq-title">
        <h2 id="ct-faq-title">Common questions</h2>
        <div className="ct-faq-list">
          {FAQ.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="newsletter-bar" id="register">
        <div className="newsletter-container">
          <div className="newsletter-info reveal-left">
            <i className="fa-regular fa-envelope-open newsletter-icon"></i>
            <div className="newsletter-text">
              <h4>Stay in the loop</h4>
              <p>Get the latest deals, destinations, and travel tips delivered straight to your inbox.</p>
            </div>
          </div>
          <div className="newsletter-form-container reveal-right">
            <form className="newsletter-form">
              <input type="email" placeholder="Enter your email address" required aria-label="Email for newsletter" />
              <button type="submit">Subscribe</button>
            </form>
            <div className="newsletter-agree">
              <input type="checkbox" id="newsletter-check" required />
              <label htmlFor="newsletter-check">I agree to terms & privacy policy</label>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
