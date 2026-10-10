/*
 * SAMPLE FIGURES, for the parts of an agency dashboard that need records the system does not keep yet:
 * bookings, payments, visa processing, supplier commissions and client feedback.
 *
 * Nothing here is real. Every card that uses it carries a "Sample" label and can be hidden with the switch on
 * the page, and the numbers are generated (the same ones every time), not stored. To connect one for real, add
 * the data to the dashboard endpoint, then replace the call to its function below in the tab that uses it.
 * Delete this file once nothing imports it.
 */

import type { SeriesPoint } from "./charts";

/** A small repeatable random number generator, so the sample figures do not change on every visit. */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const SAMPLE_CURRENCY = "USD";

const weekdayWeight = [1.05, 1.15, 1.1, 1.0, 0.95, 0.55, 0.7]; // Monday first

/** Daily revenue lined up with the real period's dates, and the period before it. */
export function sampleRevenue(dates: string[], labels: string[]) {
  const rand = seeded(dates.length * 97 + 11);
  const points: SeriesPoint[] = dates.map((iso, i) => {
    const [y, m, d] = iso.split("-").map(Number);
    const weekday = (new Date(y, m - 1, d).getDay() + 6) % 7;
    const base = 1500 * weekdayWeight[weekday] * (0.82 + (i / dates.length) * 0.4);
    const spike = rand() > 0.9 ? 1.9 : 1;
    const value = Math.round((base + rand() * 900 - 250) * spike);
    return {
      label: labels[i],
      value: Math.max(0, value),
      previous: Math.round(Math.max(0, value * (0.74 + rand() * 0.14))),
    };
  });
  const total = points.reduce((s, p) => s + p.value, 0);
  const previousTotal = points.reduce((s, p) => s + (p.previous ?? 0), 0);
  const bookings = Math.max(1, Math.round(total / 2350));
  const previousBookings = Math.max(1, Math.round(previousTotal / 2280));
  return {
    points,
    total,
    previousTotal,
    bookings,
    previousBookings,
    averageBooking: Math.round(total / bookings),
    previousAverageBooking: Math.round(previousTotal / previousBookings),
    commission: Math.round(total * 0.115),
    previousCommission: Math.round(previousTotal * 0.108),
  };
}

export const sampleServiceRevenue = [
  { key: "HolidayPackage", label: "Holidays", share: 0.54 },
  { key: "Flight", label: "Flights", share: 0.24 },
  { key: "HotelReservation", label: "Hotels", share: 0.12 },
  { key: "VisaSupport", label: "Visas", share: 0.07 },
  { key: "PrivateCharter", label: "Private charter", share: 0.03 },
];

export const sampleChannels = [
  { key: "web", label: "Website", share: 0.38 },
  { key: "whatsapp", label: "WhatsApp", share: 0.27 },
  { key: "referral", label: "Referrals", share: 0.19 },
  { key: "corporate", label: "Corporate accounts", share: 0.11 },
  { key: "events", label: "Events", share: 0.05 },
];

/** A monthly revenue target, and how far along it is. */
export const sampleTarget = { goal: 60_000, achieved: 0.71 };

export const sampleAgents = [
  { name: "Agent A", revenue: 21_400, bookings: 9, conversion: 0.41 },
  { name: "Agent B", revenue: 17_950, bookings: 8, conversion: 0.36 },
  { name: "Agent C", revenue: 13_200, bookings: 6, conversion: 0.33 },
  { name: "Agent D", revenue: 8_600, bookings: 4, conversion: 0.27 },
];

/** Share of quotes that become a booking, and of bookings that are paid in full. */
export const sampleConversion = { quoteToBooking: 0.34, bookingToPaid: 0.78 };

export const sampleVisas = {
  stages: [
    { key: "submitted", label: "Submitted", count: 18 },
    { key: "review", label: "In review", count: 12 },
    { key: "approved", label: "Approved", count: 9 },
    { key: "collected", label: "Passport returned", count: 7 },
  ],
  averageDays: 9,
  approvalRate: 0.94,
};

export const samplePayments = {
  collected: 52_400,
  outstanding: 18_400,
  aging: [
    { key: "notdue", label: "Not due yet", amount: 9_200 },
    { key: "d7", label: "1 to 7 days late", amount: 4_100 },
    { key: "d30", label: "8 to 30 days late", amount: 4_000 },
    { key: "d30p", label: "Over 30 days late", amount: 1_100 },
  ],
  dueThisWeek: [
    { id: "p1", client: "Client A", detail: "Balance, safari package", amount: 3_200, due: "Tomorrow" },
    { id: "p2", client: "Client B", detail: "Deposit, flights", amount: 1_450, due: "In 3 days" },
    { id: "p3", client: "Client C", detail: "Balance, hotel stay", amount: 2_100, due: "In 5 days" },
  ],
};

export const samplePartners = [
  { name: "Safari lodge group", kind: "Lodges", bookings: 14, revenue: 31_800, commission: 3_970, rating: 4.8 },
  { name: "Regional airline", kind: "Flights", bookings: 22, revenue: 18_900, commission: 1_420, rating: 4.3 },
  { name: "Visa processing partner", kind: "Visas", bookings: 31, revenue: 4_650, commission: 930, rating: 4.6 },
  { name: "Ground handler", kind: "Transfers", bookings: 19, revenue: 6_200, commission: 1_090, rating: 4.5 },
  { name: "Beach resort chain", kind: "Hotels", bookings: 9, revenue: 12_400, commission: 1_680, rating: 4.1 },
];

/** Commission earned and commission still to be paid by suppliers, by month. */
export const sampleCommission = [
  { label: "May", a: 5_200, b: 800 },
  { label: "Jun", a: 5_900, b: 1_100 },
  { label: "Jul", a: 6_700, b: 900 },
  { label: "Aug", a: 6_100, b: 1_700 },
  { label: "Sep", a: 7_400, b: 1_300 },
  { label: "Oct", a: 4_900, b: 3_600 },
];

export const sampleClients = {
  nps: 64,
  rating: 4.7,
  reviews: 38,
  repeatShare: 0.31,
  returning: 31,
  newClients: 69,
};
