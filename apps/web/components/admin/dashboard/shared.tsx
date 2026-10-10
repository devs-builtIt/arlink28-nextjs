"use client";

import type { ReactNode } from "react";
import type { DashboardResponse } from "@arlink28/api-client";
import { money } from "@/components/admin/format";
import { compact, type SeriesPoint } from "./charts";
import { useInView } from "./motion";
import { NotConnected, SamplePill, useShowSample } from "./sample";

/* ── labels ────────────────────────────────────────────────────────────────────────────────────── */

export const PERIODS = [
  { days: 7, label: "7 days", short: "7D" },
  { days: 30, label: "30 days", short: "30D" },
  { days: 90, label: "90 days", short: "90D" },
  { days: 365, label: "12 months", short: "12M" },
] as const;

export const PRODUCT: Record<string, string> = {
  HolidayPackage: "Holidays",
  Flight: "Flights",
  HotelReservation: "Hotels",
  VisaSupport: "Visas",
  PrivateCharter: "Private charter",
  General: "General enquiries",
};
export const TYPE: Record<string, string> = {
  Package: "Package",
  General: "General",
  Booking: "Booking",
  Partnership: "Partnership",
  Career: "Careers",
  Investor: "Investors",
};
// Navy first, then lighter steel blues, with sand and slate to tell neighbours apart. Red is kept for what needs action.
export const PALETTE = ["#0b1726", "#2f5d9b", "#7da3d6", "#d4b078", "#8a96a8", "#c9d3e0"];
export const CATALOGUE_COLORS = { published: "#0b1726", draft: "#7da3d6", archived: "#c9d3e0" };
export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* ── formatting ────────────────────────────────────────────────────────────────────────────────── */

export const dayOf = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const shortDate = (iso: string, withYear = false) =>
  dayOf(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...(withYear ? { year: "2-digit" } : {}),
  });

export function duration(hours: number | null): string {
  if (hours === null) return "—";
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m`;
  if (hours < 24) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 && h < 10 ? `${h}h ${m}m` : `${Math.round(hours)}h`;
  }
  return `${(hours / 24).toFixed(1).replace(/\.0$/, "")} days`;
}

export function ageTone(iso: string): "fresh" | "slow" | "late" {
  const hours = (Date.now() - new Date(iso).getTime()) / 3_600_000;
  return hours < 24 ? "fresh" : hours < 72 ? "slow" : "late";
}

/** Daily points, or weekly ones for a long range, with the previous period lined up beside each. */
export function seriesPoints(data: DashboardResponse): { points: SeriesPoint[]; unit: string; values: number[] } {
  const { series, previousSeries } = data.enquiries;
  const bucket = data.days > 90 ? 7 : 1;
  const points: SeriesPoint[] = [];
  for (let i = 0; i < series.length; i += bucket) {
    const slice = series.slice(i, i + bucket);
    const before = previousSeries.slice(i, i + bucket);
    points.push({
      label: bucket > 1 ? shortDate(slice[0].date, true) : shortDate(slice[0].date),
      value: slice.reduce((s, d) => s + d.count, 0),
      previous: before.reduce((s, d) => s + d.count, 0),
    });
  }
  return { points, unit: "enquiries", values: points.map((p) => p.value) };
}

/* ── building blocks ───────────────────────────────────────────────────────────────────────────── */

/**
 * A card that rises into place, and tells its charts when they are on screen so they draw themselves then.
 * `sample` marks a card that runs on made-up figures: it gets a "Sample" label, and when the visitor has switched
 * samples off it says what record it is waiting for instead. `sample` is the name of that record.
 */
export function Card({
  title,
  note,
  action,
  span,
  index = 0,
  sample,
  children,
  className = "",
}: {
  title?: string;
  note?: ReactNode;
  action?: ReactNode;
  span?: 4 | 5 | 6 | 7 | 8 | 12;
  index?: number;
  sample?: string;
  children: (inView: boolean) => ReactNode;
  className?: string;
}) {
  const [ref, inView] = useInView<HTMLElement>();
  const showSample = useShowSample();
  const hidden = !!sample && !showSample;
  return (
    <section
      ref={ref}
      className={`dv-card${span ? ` dv-span-${span}` : ""}${sample ? " is-sample" : ""} ${className}`}
      style={{ ["--i" as string]: index }}
      aria-label={title}
    >
      {(title || action || sample) && (
        <div className="dv-card-head">
          <div>
            {title && <h2 className="dv-card-title">{title}</h2>}
            {note && !hidden && <p className="dv-card-note">{note}</p>}
          </div>
          <div className="dv-card-tools">
            {sample && !hidden && <SamplePill />}
            {!hidden && action}
          </div>
        </div>
      )}
      {hidden ? <NotConnected what={sample} /> : children(inView)}
    </section>
  );
}

export function Delta({ now, before }: { now: number; before: number }) {
  if (before === 0) return <span className="dv-delta is-flat">{now === 0 ? "No change" : "First activity"}</span>;
  const pct = Math.round(((now - before) / before) * 100);
  if (pct === 0) return <span className="dv-delta is-flat">No change</span>;
  const up = pct > 0;
  return (
    <span className={`dv-delta ${up ? "is-up" : "is-down"}`}>
      <svg viewBox="0 0 12 12" aria-hidden="true">
        <path d={up ? "M6 10V2M2.5 5.5 6 2l3.5 3.5" : "M6 2v8M2.5 6.5 6 10l3.5-3.5"} />
      </svg>
      {Math.abs(pct)}%
    </span>
  );
}

export function Segmented({
  value,
  onChange,
  busy,
}: {
  value: number;
  onChange: (days: number) => void;
  busy: boolean;
}) {
  return (
    <div className="dv-seg" role="group" aria-label="Period" aria-busy={busy}>
      {PERIODS.map((p) => (
        <button
          key={p.days}
          type="button"
          className={p.days === value ? "is-on" : undefined}
          aria-pressed={p.days === value}
          aria-label={`Last ${p.label}`}
          onClick={() => onChange(p.days)}
        >
          {p.short}
        </button>
      ))}
    </div>
  );
}

/* ── money and headline figures ────────────────────────────────────────────────────────────────── */

/** Whole dollars, for the sample figures: "$12,400". */
export const usd = (n: number) => money(Math.round(n) * 100, "USD");
/** "$12.4k", for axes. */
export const usdShort = (n: number) => `$${compact(n)}`;

/**
 * One headline figure. A sample one shows a "Sample" label, and a dash when samples are switched off.
 * Pass `delta` for the change against the period before.
 */
export function Stat({
  index,
  label,
  value,
  sub,
  delta,
  sample,
  alert,
  children,
}: {
  index: number;
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  delta?: ReactNode;
  sample?: boolean;
  alert?: boolean;
  children?: ReactNode;
}) {
  const showSample = useShowSample();
  const off = !!sample && !showSample;
  return (
    <div
      className={`dv-kpi${alert ? " is-alert" : ""}${sample ? " is-sample" : ""}`}
      style={{ ["--i" as string]: index }}
    >
      <div className="dv-kpi-top">
        <span className="dv-kpi-label">{label}</span>
        {sample ? !off && <SamplePill /> : delta}
      </div>
      {off ? <span className="dv-num">—</span> : value}
      {(off || sub) && <p className="dv-kpi-sub">{off ? "Not connected yet." : sub}</p>}
      {!off && children}
    </div>
  );
}

/** The change against the period before, for a figure that has no real previous value to compare with. */
export function SampleDelta({ now, before }: { now: number; before: number }) {
  return <Delta now={now} before={before} />;
}
