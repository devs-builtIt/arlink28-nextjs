"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/connect", label: "Connect" },
  { href: "/team", label: "Team" },
  { href: "/services", label: "Services" },
  { href: "/packages", label: "Packages" },
  { href: "/travel", label: "Travel" },
  { href: "/opportunities", label: "Opportunities" },
  { href: "/engagement", label: "Engagement" },
];

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu whenever the route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : href === "/packages"
        ? ["/packages", "/flights", "/hotels", "/visas"].some((p) => pathname.startsWith(p))
        : pathname.startsWith(href);

  return (
    <>
      <header id="main-header" className={menuOpen ? "menu-open" : ""}>
        <Link className="logo-container" href="/">
          <img
            alt="ARLinks Logo"
            id="header-logo"
            width={160}
            height={40}
            decoding="async"
            src="/images/logo.png"
            style={{ color: "transparent", width: "auto", height: "40px" }}
          />
        </Link>
        {/* The site CSS reveals the mobile menu and overlay with `.active`. */}
        <nav id="nav-menu" className={menuOpen ? "active" : ""}>
          {NAV_LINKS.map((link) => (
            <Link key={link.href} className={isActive(link.href) ? "active" : ""} href={link.href}>
              {link.label}
            </Link>
          ))}
          <Link className="btn btn-primary nav-contact-btn" href="/contact">
            Contact Us
          </Link>
          <a className="btn btn-secondary nav-signin-btn" href="/admin/login">
            <i className="fa-solid fa-right-to-bracket" aria-hidden="true"></i>
            Sign in
          </a>
        </nav>
        <div className="nav-actions">
          <button className="icon-btn" aria-label="Search">
            <i className="fa-solid fa-magnifying-glass"></i>
          </button>
          <button className="icon-btn" aria-label="Language">
            <i className="fa-solid fa-globe"></i>
          </button>
          {/* Staff sign-in; middleware.ts sends signed-in visitors straight to the dashboard.
              A plain <a> (full page load), so the public site's CSS doesn't carry into the admin. */}
          <a className="btn btn-secondary" id="header-signin-btn" href="/admin/login">
            <i className="fa-solid fa-right-to-bracket" aria-hidden="true"></i>
            Sign in
          </a>
          <Link className="btn btn-primary" id="header-register-btn" href="/contact">
            Contact Us
          </Link>
          <button
            className="mobile-menu-toggle"
            id="menu-toggle-btn"
            aria-label="Toggle Menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <i className={menuOpen ? "fa-solid fa-xmark" : "fa-solid fa-bars"}></i>
          </button>
        </div>
      </header>
      <div
        className={menuOpen ? "menu-overlay active" : "menu-overlay"}
        id="menu-overlay"
        onClick={() => setMenuOpen(false)}
      ></div>
    </>
  );
}
