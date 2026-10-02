"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Icon, { type IconName } from "@/components/home/Icon";
import { PHONES } from "@/content/home-proof";
import { track } from "@/utils/track";

// What a traveller comes to do, then Essentials (the company) and Elite Jets (private charter).
const MAIN = [
  { href: "/flights", label: "Flights" },
  { href: "/hotels", label: "Hotels" },
  { href: "/visas", label: "Visas" },
  { href: "/packages", label: "Holidays" },
];

const ESSENTIALS: { href: string; label: string; text: string; icon: IconName }[] = [
  { href: "/about", label: "About us", text: "Who we are, and where we are taking ARLink28.", icon: "globe" },
  { href: "/team", label: "Team", text: "The people who price and book your trips.", icon: "person" },
  { href: "/blogs", label: "Blogs", text: "Travel stories and guides for the routes you fly.", icon: "layers" },
  {
    href: "/contact",
    label: "Contact",
    text: "Message or call us, or find our Lagos and London offices.",
    icon: "message",
  },
];

const ELITE = { href: "/elite-jets", label: "Elite Jets" };

// More of the site, shown in the phone menu only.
const MORE = [
  { href: "/services", label: "Services" },
  { href: "/travel", label: "Travel" },
  { href: "/destinations", label: "Destinations" },
  { href: "/connect", label: "Connect" },
  { href: "/opportunities", label: "Opportunities" },
  { href: "/engagement", label: "Engagement" },
];

function ThemeToggle() {
  // null until mounted: the real theme is only known in the browser (a saved choice, else dark).
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    const set = document.documentElement.dataset.theme;
    setDark(set !== "light");
  }, []);

  const flip = () => {
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("arlink-theme", next);
    } catch {
      // Private mode: the choice just lasts for this visit.
    }
    setDark(!dark);
    track("theme_toggle", { theme: next });
  };

  return (
    <button
      type="button"
      className="sh-theme"
      onClick={flip}
      aria-label={dark === null ? "Switch colour theme" : dark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {dark ? (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7Z" />
        </svg>
      )}
    </button>
  );
}

export default function Header({ themable = false }: { themable?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [essentialsOpen, setEssentialsOpen] = useState(false);
  const essentialsRef = useRef<HTMLDivElement>(null);

  // Close the menu whenever the route changes.
  useEffect(() => {
    setOpen(false);
    setEssentialsOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // While the menu is open the page behind it does not scroll, and Escape closes it.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // The Essentials dropdown closes on Escape, or on a click or focus anywhere outside it.
  useEffect(() => {
    if (!essentialsOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setEssentialsOpen(false);
    const onOutside = (e: Event) => {
      if (!essentialsRef.current?.contains(e.target as Node)) setEssentialsOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onOutside);
    document.addEventListener("focusin", onOutside);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onOutside);
      document.removeEventListener("focusin", onOutside);
    };
  }, [essentialsOpen]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const essentialsActive = ESSENTIALS.some((l) => isActive(l.href));
  const quote = () => track("hero_cta_click", { cta: "header_quote" });

  return (
    <header
      className={`sh${scrolled ? " is-scrolled" : ""}${open ? " is-open" : ""}${essentialsOpen ? " is-mega" : ""}`}
    >
      <a className="sh-skip" href="#main">
        Skip to content
      </a>
      <div className="sh-bar">
        <Link className="sh-logo" href="/" aria-label="ARLink28 home">
          <img alt="" width={62} height={50} decoding="async" src="/images/logo.png" />
          <span>ARLink28</span>
        </Link>

        <nav className="sh-nav" aria-label="Main">
          {MAIN.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={isActive(link.href) ? "is-active" : undefined}
              aria-current={isActive(link.href) ? "page" : undefined}
              onMouseEnter={() => setEssentialsOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div
            className="sh-drop"
            ref={essentialsRef}
            onMouseEnter={() => setEssentialsOpen(true)}
            onMouseLeave={() => setEssentialsOpen(false)}
          >
            <button
              type="button"
              className={`sh-drop-btn${essentialsActive ? " is-active" : ""}`}
              aria-expanded={essentialsOpen}
              aria-controls="sh-essentials"
              onClick={(e) => setEssentialsOpen((v) => (e.detail === 0 ? !v : true))}
            >
              Essentials
              <svg viewBox="0 0 12 12" aria-hidden="true">
                <path d="m2.5 4.5 3.5 3.5 3.5-3.5" />
              </svg>
            </button>
            {essentialsOpen && (
              <div className="sh-mega" id="sh-essentials">
                <ul className="sh-mega-cards">
                  {ESSENTIALS.map((link, i) => (
                    <li key={link.href} style={{ ["--i" as string]: i }}>
                      <Link href={link.href} aria-current={isActive(link.href) ? "page" : undefined}>
                        <Icon name={link.icon} />
                        <span className="sh-mega-title">
                          {link.label}
                          <svg viewBox="0 0 16 16" aria-hidden="true">
                            <path d="M3 8h10M9 4l4 4-4 4" />
                          </svg>
                        </span>
                        <span className="sh-mega-text">{link.text}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="sh-mega-feature" style={{ ["--i" as string]: 4 }}>
                  <img src="/images/home/proof-harare.webp" alt="" decoding="async" width={900} height={1200} />
                  <p className="sh-mega-title">ARLink28 on the road</p>
                  <p className="sh-mega-text">Find the team at aviation and travel events across Africa and the UK.</p>
                  <ul className="sh-mega-links">
                    <li>
                      <a href={PHONES[0].href}>
                        Call {PHONES[0].label}
                        <svg viewBox="0 0 16 16" aria-hidden="true">
                          <path d="M3 8h10M9 4l4 4-4 4" />
                        </svg>
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
          <Link
            href={ELITE.href}
            className={isActive(ELITE.href) ? "is-active" : undefined}
            onMouseEnter={() => setEssentialsOpen(false)}
            aria-current={isActive(ELITE.href) ? "page" : undefined}
          >
            {ELITE.label}
          </Link>
        </nav>

        <div className="sh-actions">
          {themable && (
            <span className="sh-theme-bar">
              <ThemeToggle />
            </span>
          )}
          <Link className="sh-signin" href="/admin/login">
            Sign in
          </Link>
          <Link className="sh-cta" href="/quote" onClick={quote}>
            Get a quote
          </Link>
          <button
            type="button"
            className="sh-toggle"
            aria-label="Menu"
            aria-expanded={open}
            aria-controls="sh-sheet"
            onClick={() => setOpen((v) => !v)}
          >
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
          </button>
        </div>
      </div>

      {open && (
        <div className="sh-sheet" id="sh-sheet">
          <nav className="sh-sheet-main" aria-label="Menu">
            {[...MAIN, ELITE].map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="sh-sheet-company">
            <p>Essentials</p>
            {ESSENTIALS.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
            <p>More</p>
            {MORE.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </div>
          <div className="sh-sheet-actions">
            {themable && (
              <span className="sh-theme-sheet">
                <ThemeToggle />
              </span>
            )}
            <Link className="sh-cta" href="/quote" onClick={quote}>
              Get a quote
            </Link>
            <Link className="sh-cta sh-cta-quiet" href="/admin/login">
              Sign in
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
