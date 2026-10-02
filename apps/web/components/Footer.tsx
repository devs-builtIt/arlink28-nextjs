import Link from "next/link";
import { PHONES, WHATSAPP_URL } from "@/content/home-proof";
import FooterMark from "./FooterMark";

const TRAVEL = [
  { href: "/flights", label: "Flights" },
  { href: "/hotels", label: "Hotel reservations" },
  { href: "/visas", label: "Visa support" },
  { href: "/packages", label: "Holiday packages" },
  { href: "/elite-jets", label: "Elite Jets" },
  { href: "/destinations", label: "Destinations" },
  { href: "/services", label: "All services" },
];

const COMPANY = [
  { href: "/about", label: "About" },
  { href: "/team", label: "Team" },
  { href: "/blogs", label: "Blogs" },
  { href: "/connect", label: "Connect" },
  { href: "/travel", label: "Travel" },
  { href: "/engagement", label: "Engagement" },
  { href: "/opportunities#careers", label: "Careers" },
  { href: "/opportunities#invest", label: "Investors" },
  { href: "/opportunities#partnerships", label: "Partnerships" },
];

const LEGAL = [
  { href: "/terms-of-service", label: "Terms" },
  { href: "/privacy-policy", label: "Privacy" },
  { href: "/refund-policy", label: "Refunds and cancellations" },
  { href: "/affiliate-disclosure", label: "Affiliate disclosure" },
  { href: "/cookie-policy", label: "Cookies" },
  { href: "/disclaimer", label: "Disclaimer" },
];

export default function Footer() {
  return (
    <footer className="sf" id="contact">
      <div className="sf-inner">
        <div className="sf-top">
          <div className="sf-brand">
            <Link className="sf-logo" href="/" aria-label="ARLink28 home">
              <img alt="" loading="lazy" width={62} height={50} decoding="async" src="/images/logo.png" />
              <span>ARLink28</span>
            </Link>
            <p>
              Flights, hotels, visas and holidays across Africa and beyond. A travel agency today, building towards an
              airline of our own.
            </p>
            <div className="sf-social">
              <a
                href="https://www.instagram.com/fly_arlink28?igsh=dnpyYTkzcXZrc3J0"
                aria-label="Instagram"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fa-brands fa-instagram" aria-hidden="true"></i>
              </a>
              <a
                href="https://www.tiktok.com/@fly_arlink28?_r=1&_t=ZS-97TMxBPfuAU"
                aria-label="TikTok"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fa-brands fa-tiktok" aria-hidden="true"></i>
              </a>
              <a href={WHATSAPP_URL} aria-label="WhatsApp" target="_blank" rel="noopener noreferrer">
                <i className="fa-brands fa-whatsapp" aria-hidden="true"></i>
              </a>
            </div>
          </div>

          <nav className="sf-col" aria-label="Travel">
            <h2>Travel</h2>
            <ul>
              {TRAVEL.map((l) => (
                <li key={l.href}>
                  <Link href={l.href}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="sf-col" aria-label="Company">
            <h2>Company</h2>
            <ul>
              {COMPANY.map((l) => (
                <li key={l.href}>
                  <Link href={l.href}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="sf-col">
            <h2>Talk to us</h2>
            <ul>
              <li>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                  WhatsApp
                </a>
              </li>
              {PHONES.map((p) => (
                <li key={p.href}>
                  <a href={p.href}>{p.label}</a>
                </li>
              ))}
              <li>
                <Link href="/contact">Contact form</Link>
              </li>
              <li>
                <Link href="/contact#faq">Questions</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="sf-bottom">
          <p>© 2026 ARLink28. All rights reserved.</p>
          <ul>
            {LEGAL.map((l) => (
              <li key={l.href}>
                <Link href={l.href}>{l.label}</Link>
              </li>
            ))}
            <li>
              {/* A plain <a> (full page load), so the public site's CSS doesn't carry into the admin. */}
              <a id="footer-signin" href="/admin/login">
                Staff sign in
              </a>
            </li>
          </ul>
        </div>
        <FooterMark />
      </div>
    </footer>
  );
}
