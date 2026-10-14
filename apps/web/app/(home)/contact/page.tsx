import type { Metadata } from "next";
import PageBanner from "@/components/PageBanner";
import EnquiryForm from "@/components/contact/EnquiryForm";
import { GENERAL_TYPES, type EnquiryPackage, type GeneralType } from "@/components/contact/types";
import { headline, publicPath } from "@/utils/publicProducts";
import { getPackage } from "@/utils/server/catalogue";
import { isUploaded, testPhotosEnabled, testPhotosFor } from "@/utils/testPhotos";
import "../../styles/home.css";
import "../../(web)/styles/contact.css";

export const metadata: Metadata = {
  title: "Contact | ARLink28",
  description: "Ask about a safari package, a booking, a partnership or a career. Send an enquiry or call ARLink28.",
};

type Search = { searchParams: { [key: string]: string | string[] | undefined } };

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** The package photo, with the same stand-in the package cards use while packages have no real photography. */
function photoFor(d: NonNullable<Awaited<ReturnType<typeof getPackage>>>): string | null {
  const hero = d.media.find((m) => m.role === "Hero")?.path ?? null;
  if (testPhotosEnabled() && !isUploaded(hero)) {
    return testPhotosFor(d.slug, d.destination.slug, { count: 1, width: 400 })[0].src;
  }
  return hero;
}

const FAQ = [
  {
    q: "How do I book a flight with ARLink28?",
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
    q: "Does ARLink28 offer group booking discounts?",
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
    photo: photoFor(detail),
    place: `${detail.destination.name}, ${detail.destination.country}`,
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
    <div className="hm hm-ct">
      <PageBanner
        label="Contact"
        id="hm-qp-h"
        title="Contact us"
        intro={
          pkg
            ? `Tell us who you are and we will come back to you about this ${pkg.kind === "HolidayPackage" ? "package" : "request"}.`
            : "Ask about a package, a booking, a partnership or a role. Send a message here, or reach us by phone."
        }
      />

      <section className="hm-sec hm-sec-white hm-qsec" data-tone="light" aria-label="Send a message">
        <div className="hm-qp hm-wrap">
          <div className="hm-qp-side">
            <img src="/images/contact/victoria-falls.webp" alt="" width={1600} height={2400} />
            <div className="hm-qp-copy">
              <h2>Prefer to talk?</h2>
              <p>Call us, write to us, or visit one of our offices. The team answers every request personally.</p>
            </div>
            <aside aria-label="Other ways to reach us">
              <ul className="hm-qp-contacts">
                <li>
                  <span className="hm-qp-icon" aria-hidden="true">
                    <i className="fa-solid fa-phone"></i>
                  </span>
                  <div>
                    <span>Phone number</span>
                    <a href="tel:+2347047009128">+234 704 700 9128</a>
                    <a href="tel:+447539071257">+44 753 907 1257</a>
                  </div>
                </li>
                <li>
                  <span className="hm-qp-icon" aria-hidden="true">
                    <i className="fa-solid fa-envelope"></i>
                  </span>
                  <div>
                    <span>Bookings and support</span>
                    <a href="mailto:support@arlink28.com">support@arlink28.com</a>
                  </div>
                </li>
                <li>
                  <span className="hm-qp-icon" aria-hidden="true">
                    <i className="fa-solid fa-location-dot"></i>
                  </span>
                  <div>
                    <span>Offices</span>
                    <strong>Ikoyi, Lagos</strong>
                    <strong>Covent Garden, London</strong>
                  </div>
                </li>
              </ul>
            </aside>
          </div>

          <section className="hm-qp-card" id="form" aria-labelledby="ct-form-title">
            <h2 id="ct-form-title" className="hm-qp-title">
              {pkg ? "Send an enquiry" : "Send a message"}
            </h2>
            <p className="hm-qp-sub">
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
        </div>
      </section>

      <section className="hm-sec hm-sec-tight" aria-labelledby="ct-more-title">
        <div className="hm-wrap hm-ct-more">
          <div>
            <h2 id="ct-more-title">Support hours</h2>
            <dl className="hm-ct-hours">
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
          <div>
            <h2>Other contacts</h2>
            <dl className="hm-ct-hours">
              <div>
                <dt>Partnerships</dt>
                <dd>
                  <a href="mailto:partners@arlink28.com">partners@arlink28.com</a>
                </dd>
              </div>
              <div>
                <dt>Investors</dt>
                <dd>
                  <a href="mailto:investors@arlink28.com">investors@arlink28.com</a>
                </dd>
              </div>
              <div>
                <dt>Careers</dt>
                <dd>
                  <a href="mailto:careers@arlink28.com">careers@arlink28.com</a>
                </dd>
              </div>
            </dl>
          </div>
          <div>
            <h2>Offices</h2>
            <dl className="hm-ct-hours">
              <div>
                <dt>Lagos</dt>
                <dd>2nd Floor, Office 316B, Mulliner Towers, 39 Alfred Rewane Road, Ikoyi, Lagos, Nigeria 101233</dd>
              </div>
              <div>
                <dt>London</dt>
                <dd>71–75 Shelton Street, Covent Garden, London WC2H 9JQ, United Kingdom</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="hm-sec hm-sec-white" data-tone="light" id="faq" aria-labelledby="ct-faq-title">
        <div className="hm-wrap">
          <div className="hm-faq-wrap">
            <div className="hm-faq-side">
              <h2 className="hm-title hm-title-left" id="ct-faq-title">
                <span className="hm-sticker" aria-hidden="true">
                  FAQ
                </span>
                Common
                <br />
                <span className="hm-dim">questions.</span>
              </h2>
              <p>Cannot see your question? Send us a message and a person replies.</p>
              <a className="hm-btn hm-btn-primary" href="#form">
                Send a message
              </a>
            </div>
            <div className="hm-faq">
              {FAQ.map((item) => (
                <details key={item.q}>
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
