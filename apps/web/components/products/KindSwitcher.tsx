import Link from "next/link";

const KINDS = [
  { href: "/packages", label: "Holiday packages" },
  { href: "/flights", label: "Flights" },
  { href: "/hotels", label: "Hotel reservations" },
  { href: "/visas", label: "Visa support" },
];

/** Moves between the four kinds of listing from the top of any of their list pages. */
export default function KindSwitcher({ active }: { active: string }) {
  return (
    <nav className="pkgs-kinds" aria-label="Kind of listing">
      {KINDS.map((k) => (
        <Link key={k.href} href={k.href} aria-current={k.href === active ? "page" : undefined}>
          {k.label}
        </Link>
      ))}
    </nav>
  );
}
