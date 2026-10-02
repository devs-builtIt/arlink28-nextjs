"use client";

import type { ReactNode } from "react";
import Dropdown from "@/components/home/Dropdown";
import type { DestinationResponse } from "@arlink28/api-client";
import { CATEGORIES, GUESTS } from "@/components/packages/HeroSearch";
import { useListing, type ListingParams } from "@/components/packages/ListingContext";

const SORTS: [string, string][] = [
  ["", "Featured first"],
  ["price", "Price, lowest first"],
  ["-price", "Price, highest first"],
  ["nights", "Shortest stay first"],
];

type Props = {
  total: number | null;
  /** What the results are called, singular and plural. Packages by default. */
  noun?: [string, string];
  /** The orderings offered. Everything but shortest-stay by default. */
  sorts?: [string, string][];
  destinations: DestinationResponse[];
  /** The partner behind the ?partner= filter, when there is one. */
  partnerName?: string;
};

/** How many packages, what they are filtered by (each removable), and how they are ordered. */
export default function ResultsBar({
  total,
  destinations,
  partnerName,
  noun = ["package", "packages"],
  sorts = SORTS,
}: Props) {
  const { params, go, pending } = useListing();

  const chips: { key: keyof ListingParams; label: string }[] = [
    params.q && { key: "q" as const, label: `“${params.q}”` },
    params.destination && {
      key: "destination" as const,
      label: destinations.find((d) => d.slug === params.destination)?.name ?? params.destination,
    },
    params.category && {
      key: "category" as const,
      label: CATEGORIES.find(([v]) => v === params.category)?.[1] ?? params.category,
    },
    params.adults && { key: "adults" as const, label: GUESTS.find(([v]) => v === params.adults)?.[1] ?? params.adults },
    params.partner && { key: "partner" as const, label: partnerName ?? params.partner },
  ].filter(Boolean) as { key: keyof ListingParams; label: string }[];

  return (
    <div className="pkgs-resultsbar" id="results">
      <div className="pkgs-resultsbar-main">
        <h2 role="status">
          {total === null
            ? noun[1].charAt(0).toUpperCase() + noun[1].slice(1)
            : total === 1
              ? `1 ${noun[0]}`
              : `${total} ${noun[1]}`}
          {pending && <span className="sr-only"> Updating</span>}
        </h2>
        {chips.length > 0 && (
          <ul className="pkgs-chips" aria-label="Filters in use">
            {chips.map((c) => (
              <li key={c.key}>
                <button type="button" className="pkgs-chip" onClick={() => go({ [c.key]: "" })}>
                  {c.label}
                  <i className="fa-solid fa-xmark" aria-hidden="true"></i>
                  <span className="sr-only">Remove this filter</span>
                </button>
              </li>
            ))}
            <li>
              <button
                type="button"
                className="pkgs-link"
                onClick={() => go({ q: "", destination: "", category: "", adults: "", partner: "" })}
              >
                Clear all
              </button>
            </li>
          </ul>
        )}
      </div>

      <div className="pkgs-sort">
        <span>Sort by</span>
        <Dropdown
          id="pkgs-sort"
          name="sort"
          ariaLabel="Sort by"
          value={params.sort}
          onChange={(v) => go({ sort: v })}
          options={sorts.map(([value, label]) => ({ value, label }))}
        />
      </div>
    </div>
  );
}

/** The results, dimmed with a progress line while new ones load. The cards themselves are drawn on the server. */
export function ResultsFrame({ children }: { children: ReactNode }) {
  const { pending } = useListing();
  return (
    <section className="pkgs-results" aria-busy={pending} data-pending={pending || undefined} aria-label="Packages">
      {pending && <span className="pkgs-progress" role="progressbar" aria-label="Loading packages"></span>}
      {children}
    </section>
  );
}
