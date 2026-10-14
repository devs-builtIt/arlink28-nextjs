"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { initials, roleLabel } from "@/components/admin/format";
import Brand from "@/components/admin/Brand";

interface Props {
  children: ReactNode;
  requireSuperAdmin?: boolean;
  /** Use the whole width of the work area, for pages with their own layout (lists, forms). */
  wide?: boolean;
}

type NavItem = { href: string; label: string; icon: string; superAdminOnly?: boolean };

const NAV: NavItem[] = [
  { href: "/admin/dashboard", label: "Overview", icon: "fa-table-cells-large" },
  { href: "/admin/packages", label: "Packages", icon: "fa-suitcase-rolling" },
  { href: "/admin/destinations", label: "Destinations", icon: "fa-earth-africa" },
  { href: "/admin/enquiries", label: "Enquiries", icon: "fa-inbox" },
  { href: "/admin/users", label: "Staff", icon: "fa-user-group", superAdminOnly: true },
  { href: "/admin/change-password", label: "Password", icon: "fa-key" },
];

export default function ProtectedPage({ children, requireSuperAdmin = false, wide = false }: Props) {
  const { user, isLoading, isSuperAdmin, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!user) router.replace("/admin/login");
  }, [isLoading, user, router]);

  // Close the mobile drawer on navigation and on Escape.
  useEffect(() => setNavOpen(false), [pathname]);
  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setNavOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen]);

  if (isLoading || !user) {
    return (
      <div className="adm-loading" role="status">
        Checking your session…
      </div>
    );
  }

  // /admin/users/invite still highlights Staff.
  const isHere = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="shell" data-nav-open={navOpen}>
      <aside className="rail" id="admin-rail">
        <div className="rail-brand">
          <Brand caption="Staff admin" />
        </div>

        <nav className="rail-nav" aria-label="Admin">
          {NAV.filter((item) => !item.superAdminOnly || isSuperAdmin).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rail-link"
              aria-current={isHere(item.href) ? "page" : undefined}
            >
              <i className={`fa-solid ${item.icon}`} aria-hidden="true"></i>
              {item.label}
            </Link>
          ))}
        </nav>

        <button className="rail-link rail-signout" onClick={logout}>
          <i className="fa-solid fa-right-from-bracket" aria-hidden="true"></i>
          Sign out
        </button>
      </aside>
      <div className="scrim" aria-hidden="true" onClick={() => setNavOpen(false)}></div>

      <div className="frame">
        {/* A div, not <header>: the public site styles bare `header` elements. */}
        <div className="topbar" role="banner">
          <button
            className="topbar-menu"
            aria-label="Menu"
            aria-expanded={navOpen}
            aria-controls="admin-rail"
            onClick={() => setNavOpen((v) => !v)}
          >
            <i className={`fa-solid ${navOpen ? "fa-xmark" : "fa-bars"}`} aria-hidden="true"></i>
          </button>
          <span className="topbar-logo">
            <Brand />
          </span>

          <div className="who">
            <span className="who-tile" aria-hidden="true">
              {initials(user.username)}
            </span>
            <span className="who-text">
              <span className="who-name">{user.username}</span>
              <span className="who-role">{roleLabel(user.role)}</span>
            </span>
          </div>
        </div>

        <main className="main">
          <div className={wide ? "main-inner main-wide" : "main-inner"}>
            {requireSuperAdmin && !isSuperAdmin ? (
              <div className="denied">
                <p>Only super admins can open this page.</p>
                <Link className="btn btn-quiet" href="/admin/dashboard">
                  Go to overview
                </Link>
              </div>
            ) : (
              children
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
