"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { DestinationResponse } from "@arlink28/api-client";
import { useListing } from "@/components/packages/ListingContext";
import Dropdown from "@/components/home/Dropdown";

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

      <div className="pkgs-seg">
        <span className="pkgs-seg-label">Destination</span>
        <Dropdown
          id="pkgs-destination"
          name="destination"
          ariaLabel="Destination"
          value={draft.destination}
          onChange={(v) => setDraft({ ...draft, destination: v })}
          options={[
            { value: "", label: "All destinations" },
            ...destinations.map((d) => ({ value: d.slug, label: d.name })),
          ]}
        />
      </div>

      <div className="pkgs-seg">
        <span className="pkgs-seg-label">Type</span>
        <Dropdown
          id="pkgs-category"
          name="category"
          ariaLabel="Type"
          value={draft.category}
          onChange={(v) => setDraft({ ...draft, category: v })}
          options={CATEGORIES.map(([value, label]) => ({ value, label }))}
        />
      </div>

      <div className="pkgs-seg">
        <span className="pkgs-seg-label">Party</span>
        <Dropdown
          id="pkgs-adults"
          name="adults"
          ariaLabel="Party"
          value={draft.adults}
          onChange={(v) => setDraft({ ...draft, adults: v })}
          options={GUESTS.map(([value, label]) => ({ value, label }))}
        />
      </div>

      <button type="submit" className="pkgs-search-button" disabled={pending}>
        {pending ? <span className="pkgs-spinner pkgs-spinner-light" aria-hidden="true"></span> : null}
        Search
      </button>
    </form>
  );
}
