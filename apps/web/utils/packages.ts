// Formatting shared by the public package pages. Plain functions, safe on server and client.

/** "US$5,652" for dollars (as the site has always shown them), the currency's own symbol otherwise. */
export function priceLabel(minor: number, currency: string): string {
  const whole = minor % 100 === 0;
  const digits = { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 };
  if (currency === "USD") return `US$${(minor / 100).toLocaleString("en-US", digits)}`;
  return new Intl.NumberFormat("en", { style: "currency", currency, ...digits }).format(minor / 100);
}

export const nightsLabel = (n: number) => `${n} ${n === 1 ? "night" : "nights"}`;

export function partyLabel(adults: number, children: number): string {
  const a = `${adults} ${adults === 1 ? "adult" : "adults"}`;
  return children > 0 ? `${a}, ${children} ${children === 1 ? "child" : "children"}` : a;
}

export const categoryLabel = (category: string) => (category === "LODGE" ? "Lodge stay" : "Safari");

const UNITS: Record<string, string> = {
  PerStay: "per stay",
  PerNight: "per night",
  PerDay: "per day",
  PerPerson: "per person",
};
export const unitLabel = (unit: string) => UNITS[unit] ?? unit;

const day = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
/** "6 Jan 2027 to 31 May 2027" for the dates a rate covers. */
export function rangeLabel(start: string, end: string): string {
  return `${day.format(new Date(`${start}T00:00:00Z`))} to ${day.format(new Date(`${end}T00:00:00Z`))}`;
}

/** Paragraphs from a description written with blank lines between them. */
export const paragraphs = (text: string | null | undefined): string[] =>
  (text ?? "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
