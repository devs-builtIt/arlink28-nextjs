"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { DestinationResponse } from "@arlink28/api-client";
import { useListing } from "@/components/packages/ListingContext";

export const CATEGORIES: [string, string][] = [
  ["", "Any type"],
  ["SAFARI", "Safari"],
  ["LODGE", "Lodge stay"],
];
export const GUESTS: [string, string][] = [
  ["", "Any party"],
  ["2", "2 or more adults"],
  ["4", "4 or more adults"],
  ["6", "6 or more adults"],
];

/**
 * The search bar that sits on the hero. One segment per question, and one button. It searches
 * when you press Search (or Enter), like the bar it is modelled on, so a half-chosen search
 * doesn't keep reloading the results underneath it.
 */
export default function HeroSearch({ destinations }: { destinations: DestinationResponse[] }) {
  const { params, go, pending } = useListing();
  const [draft, setDraft] = useState(params);

  // Follow the address (back, forward, a chip removed), but never overwrite what is being typed.
  const { q, destination, category, adults } = params;
  useEffect(() => setDraft((d) => ({ ...d, q, destination, category, adults })), [q, destination, category, adults]);

  function submit(e: FormEvent) {
    e.preventDefault();
    go({ q: draft.q.trim(), destination: draft.destination, category: draft.category, adults: draft.adults });
  }

  return (
    <form className="pkgs-search" role="search" onSubmit={submit}>
      <label className="pkgs-seg pkgs-seg-wide">
        <span className="pkgs-seg-label">Search</span>
        <span className="pkgs-seg-field">
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
          <input
            type="search"
            placeholder="Package, lodge or place"
            aria-label="Search packages, lodges or places"
            value={draft.q}
            onChange={(e) => setDraft({ ...draft, q: e.target.value })}
          />
        </span>
      </label>

      <label className="pkgs-seg">
        <span className="pkgs-seg-label">Destination</span>
        <select value={draft.destination} onChange={(e) => setDraft({ ...draft, destination: e.target.value })}>
          <option value="">All destinations</option>
          {destinations.map((d) => (
            <option key={d.slug} value={d.slug}>
              {d.name}
            </option>
          ))}
        </select>
      </label>

      <label className="pkgs-seg">
        <span className="pkgs-seg-label">Type</span>
        <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
          {CATEGORIES.map(([value, label]) => (
            <option key={value || "any"} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className="pkgs-seg">
        <span className="pkgs-seg-label">Party</span>
        <select value={draft.adults} onChange={(e) => setDraft({ ...draft, adults: e.target.value })}>
          {GUESTS.map(([value, label]) => (
            <option key={value || "any"} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <button type="submit" className="pkgs-search-button" disabled={pending}>
        {pending ? <span className="pkgs-spinner pkgs-spinner-light" aria-hidden="true"></span> : null}
        Search
      </button>
    </form>
  );
}
