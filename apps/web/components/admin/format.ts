import type { StaffRoleName } from "@arlink28/api-client";

export function roleLabel(role: StaffRoleName): string {
  return role === "SuperAdmin" ? "Super admin" : "Operator";
}

/** "AB" from "anna_bello", "A" from "anna". */
export function initials(name: string): string {
  const parts = name.split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

const relative = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
const STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["week", 7 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
];

/** "3 days ago", "yesterday", "just now". */
export function timeAgo(iso: string, now = Date.now()): string {
  const seconds = (new Date(iso).getTime() - now) / 1000;
  for (const [unit, size] of STEPS) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
  }
  return "just now";
}

export function fullDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function clockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function greeting(hour = new Date().getHours()): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/** "$8,488" from 848800 USD minor units; cents only when there are any. */
export function money(minor: number, currency: string): string {
  const whole = minor % 100 === 0;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(minor / 100);
}

/** "2 adults, 2 children" */
export function party(adults: number, children: number): string {
  const a = `${adults} ${adults === 1 ? "adult" : "adults"}`;
  return children > 0 ? `${a}, ${children} ${children === 1 ? "child" : "children"}` : a;
}

/** "SAFARI" → "Safari" */
export function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

const UNIT_LABELS: Record<string, string> = {
  PerStay: "per stay",
  PerNight: "per night",
  PerDay: "per day",
  PerPerson: "per person",
};
export const unitLabel = (unit: string) => UNIT_LABELS[unit] ?? unit;

/** Today plus `days`, as yyyy-mm-dd in local time (for date inputs). */
export function isoDateFromToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const PASSWORD_HINT = "At least 8 characters, with an uppercase letter, a lowercase letter and a digit.";

/** Whole-currency text ("8488", "8,488.50") to minor units; null when it isn't a non-negative amount. */
export function toMinor(text: string): number | null {
  const cleaned = text.replace(/[,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  return Math.round(Number(cleaned) * 100);
}

/** 848800 to "8488", 848850 to "8488.50": what a price field shows. */
export function fromMinor(minor: number | null | undefined): string {
  if (minor == null) return "";
  return minor % 100 === 0 ? String(minor / 100) : (minor / 100).toFixed(2);
}

/** "1 Nov 2026 to 15 Dec 2026" for each range of a season. */
export function rangesText(ranges: { start: string; end: string }[]): string {
  const day = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  return ranges.map((r) => `${day(r.start)} to ${day(r.end)}`).join(", ");
}
