"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { DestinationResponse } from "@arlink28/api-client";
import { useListing } from "@/components/packages/ListingContext";

/** The hero search for flights, hotels and visas: words, a place, and one button. */
export default function ProductSearch({
  destinations,
  placeholder,
  label,
}: {
  destinations: DestinationResponse[];
  placeholder: string;
  /** What is being searched, for the screen-reader label: "flights". */
  label: string;
}) {
  const { params, go, pending } = useListing();
  const [draft, setDraft] = useState(params);

  const { q, destination } = params;
  useEffect(() => setDraft((d) => ({ ...d, q, destination })), [q, destination]);

  function submit(e: FormEvent) {
    e.preventDefault();
    go({ q: draft.q.trim(), destination: draft.destination });
  }

  return (
    <form className="pkgs-search pkgs-search-short" role="search" onSubmit={submit}>
      <label className="pkgs-seg pkgs-seg-wide">
        <span className="pkgs-seg-label">Search</span>
        <span className="pkgs-seg-field">
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
          <input
            type="search"
            placeholder={placeholder}
            aria-label={`Search ${label}`}
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

      <button type="submit" className="pkgs-search-button" disabled={pending}>
        {pending ? <span className="pkgs-spinner pkgs-spinner-light" aria-hidden="true"></span> : null}
        Search
      </button>
    </form>
  );
}
