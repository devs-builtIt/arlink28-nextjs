import type { DestinationResponse } from "@arlink28/api-client";

/** One country on the destinations page: its places, split by whether they have a photo to show. */
export type CountryGroup = {
  /** ISO 3166-1 alpha-2, as the API stores it. */
  code: string;
  name: string;
  /** The country's own page, when it has been published. Without it the heading is plain text. */
  country: DestinationResponse | null;
  /** Places with a photo: these get a tile. */
  featured: DestinationResponse[];
  /** Places without one yet: listed by name, linking to their packages. */
  others: DestinationResponse[];
};

const regionNames =
  typeof Intl !== "undefined" && "DisplayNames" in Intl ? new Intl.DisplayNames(["en"], { type: "region" }) : null;

/** "BW" becomes "Botswana". Falls back to the code for anything the runtime does not know. */
export function countryName(code: string): string {
  try {
    return regionNames?.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

/**
 * Groups the published destinations by country, in the order the API sent them (which is the staff's
 * chosen order). A country shows even when its own page is not published, so Nairobi or Giza are never
 * orphaned just because their country has no write-up yet.
 */
export function groupByCountry(destinations: DestinationResponse[]): CountryGroup[] {
  const groups = new Map<string, CountryGroup>();
  const groupFor = (code: string) => {
    let g = groups.get(code);
    if (!g) {
      g = { code, name: countryName(code), country: null, featured: [], others: [] };
      groups.set(code, g);
    }
    return g;
  };

  for (const d of destinations) {
    const g = groupFor(d.country);
    if (d.kind === "Country") {
      g.country = d;
      g.name = d.name;
    } else if (d.heroPath) {
      g.featured.push(d);
    } else {
      g.others.push(d);
    }
  }

  // A country with nothing to show is left out rather than shown empty.
  return [...groups.values()]
    .filter((g) => g.featured.length + g.others.length > 0 || g.country?.heroPath)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Where a place's name should take you: its page when it has one worth reading, otherwise its packages. */
export const placeHref = (d: DestinationResponse) =>
  d.heroPath ? `/destinations/${d.slug}` : `/packages?destination=${encodeURIComponent(d.slug)}`;

/** JSON for a script tag. `<` is escaped so a stray "</script>" in staff-written text cannot end the tag. */
export const safeJson = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");
