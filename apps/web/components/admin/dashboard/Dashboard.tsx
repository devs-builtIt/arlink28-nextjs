"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import type { DashboardResponse, UserResponse } from "@arlink28/api-client";
import { useAuth } from "@/context/AuthContext";
import { dashboardApi } from "@/utils/api/dashboard";
import { usersApi } from "@/utils/api/users";
import { clockTime, fullDate, initials, money, roleLabel, timeAgo } from "@/components/admin/format";
import { Skeleton } from "@/components/admin/ui";
import { AreaChart, BarList, Columns, Count, Donut, Sparkline, Stack, type SeriesPoint, type Slice } from "./charts";
import { useCountUp, useInView, useReveal } from "./motion";

/* ── labels ────────────────────────────────────────────────────────────────────────────────────── */

const PERIODS = [
  { days: 7, label: "7 days", short: "7D" },
  { days: 30, label: "30 days", short: "30D" },
  { days: 90, label: "90 days", short: "90D" },
  { days: 365, label: "12 months", short: "12M" },
] as const;

const PRODUCT: Record<string, string> = {
  HolidayPackage: "Holidays",
  Flight: "Flights",
  HotelReservation: "Hotels",
  VisaSupport: "Visas",
  PrivateCharter: "Private charter",
  General: "General enquiries",
};
const TYPE: Record<string, string> = {
  Package: "Package",
  General: "General",
  Booking: "Booking",
  Partnership: "Partnership",
  Career: "Careers",
  Investor: "Investors",
};
// Navy first, then lighter steel blues, with sand and slate to tell neighbours apart. Red is kept for what needs action.
const PALETTE = ["#0b1726", "#2f5d9b", "#7da3d6", "#d4b078", "#8a96a8", "#c9d3e0"];
const CATALOGUE_COLORS = { published: "#0b1726", draft: "#7da3d6", archived: "#c9d3e0" };
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* ── formatting ────────────────────────────────────────────────────────────────────────────────── */

const dayOf = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const shortDate = (iso: string, withYear = false) =>
  dayOf(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...(withYear ? { year: "2-digit" } : {}),
  });

function duration(hours: number | null): string {
  if (hours === null) return "—";
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m`;
  if (hours < 24) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 && h < 10 ? `${h}h ${m}m` : `${Math.round(hours)}h`;
  }
  return `${(hours / 24).toFixed(1).replace(/\.0$/, "")} days`;
}

function ageTone(iso: string): "fresh" | "slow" | "late" {
  const hours = (Date.now() - new Date(iso).getTime()) / 3_600_000;
  return hours < 24 ? "fresh" : hours < 72 ? "slow" : "late";
}

/** Daily points, or weekly ones for a long range, with the previous period lined up beside each. */
function seriesPoints(data: DashboardResponse): { points: SeriesPoint[]; unit: string; values: number[] } {
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

/** A card that rises into place, and tells its charts when they are on screen so they draw themselves then. */
function Card({
  title,
  note,
  action,
  span,
  index = 0,
  children,
  className = "",
}: {
  title?: string;
  note?: ReactNode;
  action?: ReactNode;
  span?: 4 | 5 | 6 | 7 | 8 | 12;
  index?: number;
  children: (inView: boolean) => ReactNode;
  className?: string;
}) {
  const [ref, inView] = useInView<HTMLElement>();
  return (
    <section
      ref={ref}
      className={`dv-card${span ? ` dv-span-${span}` : ""} ${className}`}
      style={{ ["--i" as string]: index }}
      aria-label={title}
    >
      {(title || action) && (
        <div className="dv-card-head">
          <div>
            {title && <h2 className="dv-card-title">{title}</h2>}
            {note && <p className="dv-card-note">{note}</p>}
          </div>
          {action}
        </div>
      )}
      {children(inView)}
    </section>
  );
}

function Delta({ now, before }: { now: number; before: number }) {
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

function Segmented({ value, onChange, busy }: { value: number; onChange: (days: number) => void; busy: boolean }) {
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

/* ── sections ──────────────────────────────────────────────────────────────────────────────────── */

function Kpis({ data }: { data: DashboardResponse }) {
  const e = data.enquiries;
  const [ref, inView] = useInView<HTMLDivElement>();
  const { values } = seriesPoints(data);
  const period = PERIODS.find((p) => p.days === data.days)?.label ?? `${data.days} days`;
  const oldest = e.awaiting[0];
  const quoted = e.quoted[0];
  const otherCurrencies = e.quoted.length - 1;
  const late = oldest ? ageTone(oldest.createdAt) === "late" : false;
  const handled = e.contacted + e.closed;

  return (
    <div className="dv-kpis" ref={ref}>
      <div className="dv-kpi" style={{ ["--i" as string]: 0 }}>
        <div className="dv-kpi-top">
          <span className="dv-kpi-label">Enquiries</span>
          <Delta now={e.total} before={e.previousTotal} />
        </div>
        <Count value={e.total} start={inView} />
        <p className="dv-kpi-sub">
          Last {period}. {e.previousTotal.toLocaleString()} the period before.
        </p>
        <Sparkline values={values} start={inView} label={`Enquiries over the last ${period}`} />
      </div>

      <div className={`dv-kpi${e.awaitingAll > 0 ? " is-alert" : ""}`} style={{ ["--i" as string]: 1 }}>
        <div className="dv-kpi-top">
          <span className="dv-kpi-label">Waiting for a reply</span>
          {e.awaitingAll > 0 && <span className={`dv-pulse${late ? " is-late" : ""}`} aria-hidden="true" />}
        </div>
        <Count value={e.awaitingAll} start={inView} />
        <p className="dv-kpi-sub">
          {oldest ? (
            <>
              The oldest came in <strong>{timeAgo(oldest.createdAt)}</strong>.
            </>
          ) : (
            "Everything has had a reply."
          )}
        </p>
        <div className="dv-kpi-foot">
          <Link href="/admin/enquiries?status=New">Open the queue</Link>
        </div>
      </div>

      <div className="dv-kpi" style={{ ["--i" as string]: 2 }}>
        <div className="dv-kpi-top">
          <span className="dv-kpi-label">Time to act</span>
        </div>
        <span className="dv-num">{e.medianHandleHours === null ? "—" : duration(e.medianHandleHours)}</span>
        <p className="dv-kpi-sub">
          {e.medianHandleHours === null
            ? "Shows once an enquiry has been handled."
            : `Median, from an enquiry arriving to a staff update. ${handled} handled.`}
        </p>
      </div>

      <div className="dv-kpi" style={{ ["--i" as string]: 3 }}>
        <div className="dv-kpi-top">
          <span className="dv-kpi-label">Quoted</span>
        </div>
        {quoted ? (
          <Count
            value={quoted.totalMinor / 100}
            start={inView}
            format={(n) => money(Math.round(n) * 100, quoted.currency)}
          />
        ) : (
          <span className="dv-num">—</span>
        )}
        <p className="dv-kpi-sub">
          {quoted
            ? `${quoted.count} ${quoted.count === 1 ? "quote" : "quotes"} sent${otherCurrencies > 0 ? `, plus ${otherCurrencies} more ${otherCurrencies === 1 ? "currency" : "currencies"}` : ""}.`
            : "Package enquiries with a quote appear here."}
        </p>
      </div>
    </div>
  );
}

function Pipeline({ data }: { data: DashboardResponse }) {
  const e = data.enquiries;
  const handled = e.contacted + e.closed;
  const stages = [
    { key: "received", label: "Received", value: e.total, tone: "navy" },
    { key: "handled", label: "Handled", value: handled, tone: "steel" },
    { key: "closed", label: "Closed", value: e.closed, tone: "green" },
  ];
  const rate = e.total ? Math.round((e.closed / e.total) * 100) : 0;
  return (
    <Card title="Pipeline" note="Where this period's enquiries have got to." span={4} index={5}>
      {(inView) => <PipelineBody stages={stages} total={e.total} rate={rate} inView={inView} />}
    </Card>
  );
}

function PipelineBody({
  stages,
  total,
  rate,
  inView,
}: {
  stages: { key: string; label: string; value: number; tone: string }[];
  total: number;
  rate: number;
  inView: boolean;
}) {
  const progress = useReveal(inView, 1100, total);
  const shownRate = useCountUp(rate, inView);
  return (
    <>
      <ul className="dv-funnel">
        {stages.map((s, i) => {
          const local = Math.min(1, Math.max(0, progress * 1.4 - i * 0.18));
          return (
            <li key={s.key}>
              <div className="dv-funnel-row">
                <span>{s.label}</span>
                <strong>{s.value}</strong>
              </div>
              <div className="dv-track dv-track-lg">
                <div
                  className={`dv-fill dv-tone-${s.tone}`}
                  style={{ width: `${(total ? (s.value / total) * 100 : 0) * local}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <div className="dv-callout">
        <span className="dv-big">{Math.round(shownRate)}%</span>
        <span>of this period&apos;s enquiries are closed.</span>
      </div>
    </>
  );
}

function ByType({ data }: { data: DashboardResponse }) {
  const slices: Slice[] = data.enquiries.byType.map((t, i) => ({
    key: t.type,
    label: TYPE[t.type] ?? t.type,
    value: t.count,
    color: PALETTE[i % PALETTE.length],
  }));
  return (
    <Card title="What they asked about" note="Enquiries by type." span={4} index={6}>
      {(inView) =>
        slices.length === 0 ? (
          <p className="dv-empty">No enquiries in this period yet.</p>
        ) : (
          <Donut slices={slices} start={inView} centreLabel="enquiries" />
        )
      }
    </Card>
  );
}

function ByProduct({ data }: { data: DashboardResponse }) {
  const items = data.enquiries.byProduct.map((p, i) => ({
    key: p.product,
    label: PRODUCT[p.product] ?? p.product,
    value: p.count,
    color: PALETTE[i % PALETTE.length],
  }));
  return (
    <Card title="Which service" note="Enquiries by what they are about." span={4} index={7}>
      {(inView) =>
        items.length === 0 ? (
          <p className="dv-empty">Nothing yet.</p>
        ) : (
          <>
            <BarList items={items} start={inView} />
            <p className="dv-foot">
              <strong>{items[0].label}</strong> bring{" "}
              {Math.round((items[0].value / Math.max(1, data.enquiries.total)) * 100)}% of enquiries.
            </p>
          </>
        )
      }
    </Card>
  );
}

function Weekdays({ data }: { data: DashboardResponse }) {
  const values = data.enquiries.byWeekday;
  const best = values.indexOf(Math.max(...values));
  return (
    <Card
      title="Busiest days"
      note={values.some((v) => v > 0) ? `${WEEKDAYS[best]} brings the most.` : "Enquiries by day of the week."}
      span={4}
      index={8}
    >
      {(inView) => (
        <>
          <Columns values={values} labels={WEEKDAYS.map((d) => d[0])} start={inView} unit="enquiries" />
          {values.some((v) => v > 0) && (
            <p className="dv-foot">
              <strong>Weekends</strong> bring{" "}
              {Math.round(((values[5] + values[6]) / values.reduce((s, v) => s + v, 0)) * 100)}% of enquiries.
            </p>
          )}
        </>
      )}
    </Card>
  );
}

function Awaiting({ data }: { data: DashboardResponse }) {
  const e = data.enquiries;
  return (
    <Card
      title="Needs a reply"
      note={e.awaitingAll > 0 ? "Oldest first." : undefined}
      span={4}
      index={9}
      action={
        <Link className="dv-link" href="/admin/enquiries?status=New">
          View all {e.awaitingAll > 0 && <span>({e.awaitingAll})</span>}
        </Link>
      }
    >
      {() =>
        e.awaiting.length === 0 ? (
          <div className="dv-clear">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m5 12.5 4.5 4.5L19 7.5" />
            </svg>
            <p>Every enquiry has had a reply.</p>
          </div>
        ) : (
          <ul className="dv-list">
            {e.awaiting.map((a) => (
              <li key={a.id}>
                <Link href={`/admin/enquiries/${a.id}`}>
                  <span className="dv-avatar" aria-hidden="true">
                    {initials(a.name)}
                  </span>
                  <span className="dv-list-text">
                    <strong>{a.name}</strong>
                    <small>{a.packageTitle ?? TYPE[a.type] ?? a.type}</small>
                  </span>
                  <time
                    className={`dv-age is-${ageTone(a.createdAt)}`}
                    dateTime={a.createdAt}
                    title={fullDate(a.createdAt)}
                  >
                    {timeAgo(a.createdAt)}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        )
      }
    </Card>
  );
}

function TopPackages({ data }: { data: DashboardResponse }) {
  const items = data.enquiries.topPackages.map((p, i) => ({
    key: `${p.packageId ?? p.title}-${i}`,
    label: p.title,
    value: p.count,
    color: i === 0 ? "#0b1726" : "#7da3d6",
  }));
  return (
    <Card title="Most asked about" note="Packages and listings, by enquiries." span={4} index={10}>
      {(inView) =>
        items.length === 0 ? (
          <p className="dv-empty">No one has asked about a listing in this period.</p>
        ) : (
          <BarList items={items} start={inView} />
        )
      }
    </Card>
  );
}

function Catalogue({ data }: { data: DashboardResponse }) {
  const c = data.catalogue;
  const published = c.byProduct.reduce((s, p) => s + p.published, 0);
  const drafts = c.byProduct.reduce((s, p) => s + p.draft, 0);
  return (
    <Card
      title="Catalogue"
      note="What is live on the site, by service."
      span={12}
      index={12}
      action={
        <Link className="dv-link" href="/admin/packages">
          Open packages
        </Link>
      }
    >
      {(inView) => (
        <div className="dv-cat">
          <dl className="dv-facts dv-facts-row">
            <div>
              <dt>Live</dt>
              <dd>{published}</dd>
            </div>
            <div>
              <dt>Drafts</dt>
              <dd>{drafts}</dd>
            </div>
            <div>
              <dt>Featured</dt>
              <dd>{c.featured}</dd>
            </div>
            <div>
              <dt>Destinations</dt>
              <dd>
                {c.destinationsPublished}
                {c.destinationsDraft > 0 && <small> +{c.destinationsDraft} draft</small>}
              </dd>
            </div>
          </dl>
          <ul className="dv-products">
            {c.byProduct.map((p) => (
              <li key={p.product}>
                <span>{PRODUCT[p.product] ?? p.product}</span>
                <Stack
                  start={inView}
                  segments={[
                    { key: "p", label: "Live", value: p.published, color: CATALOGUE_COLORS.published },
                    { key: "d", label: "Draft", value: p.draft, color: CATALOGUE_COLORS.draft },
                    { key: "a", label: "Archived", value: p.archived, color: CATALOGUE_COLORS.archived },
                  ]}
                />
                <small>
                  {p.published} live{p.draft > 0 ? `, ${p.draft} draft` : ""}
                  {p.archived > 0 ? `, ${p.archived} archived` : ""}
                </small>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

function ToFix({ data }: { data: DashboardResponse }) {
  const c = data.catalogue;
  return (
    <Card
      title="Finish these"
      note="Live, but missing something a guest would notice."
      span={4}
      index={11}
      action={c.needingAttention > 0 ? <span className="dv-count">{c.needingAttention}</span> : undefined}
    >
      {() =>
        c.toFix.length === 0 ? (
          <div className="dv-clear">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m5 12.5 4.5 4.5L19 7.5" />
            </svg>
            <p>Every live listing looks finished.</p>
          </div>
        ) : (
          <ul className="dv-list">
            {c.toFix.map((f) => (
              <li key={f.id}>
                <Link href={`/admin/packages/${f.id}`}>
                  <span className="dv-list-text">
                    <strong>{f.title}</strong>
                    <small>{PRODUCT[f.product] ?? f.product}</small>
                  </span>
                  <span className="dv-chip">{f.reason}</span>
                </Link>
              </li>
            ))}
          </ul>
        )
      }
    </Card>
  );
}

/* ── team and session ──────────────────────────────────────────────────────────────────────────── */

// JwtService in arlink28-api issues tokens for 8 hours.
const SESSION_MS = 8 * 60 * 60 * 1000;

function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

function formatLeft(ms: number): string {
  const minutes = Math.max(0, Math.round(ms / 60_000));
  const h = Math.floor(minutes / 60);
  return h > 0 ? `${h}h ${minutes % 60}m` : `${minutes}m`;
}

function Session({ expiresAt, role }: { expiresAt: string; role: string }) {
  const now = useNow();
  const left = new Date(expiresAt).getTime() - now;
  const share = Math.min(1, Math.max(0, left / SESSION_MS));
  const r = 44;
  const c = 2 * Math.PI * r;
  return (
    <Card title="Your session" span={4} index={14}>
      {(inView) => (
        <SessionBody share={share} left={left} role={role} expiresAt={expiresAt} c={c} r={r} inView={inView} />
      )}
    </Card>
  );
}

function SessionBody({
  share,
  left,
  role,
  expiresAt,
  c,
  r,
  inView,
}: {
  share: number;
  left: number;
  role: string;
  expiresAt: string;
  c: number;
  r: number;
  inView: boolean;
}) {
  const progress = useReveal(inView, 1200);
  return (
    <div className="dv-session">
      <svg viewBox="0 0 112 112" role="img" aria-label={`${formatLeft(left)} left`}>
        <circle className="dv-ring-track" cx="56" cy="56" r={r} />
        <circle
          className="dv-ring-fill"
          cx="56"
          cy="56"
          r={r}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - share * progress)}
          transform="rotate(-90 56 56)"
        />
        <text x="56" y="56" textAnchor="middle" className="dv-ring-value">
          {formatLeft(left)}
        </text>
        <text x="56" y="73" textAnchor="middle" className="dv-ring-label">
          left
        </text>
      </svg>
      <dl className="dv-facts dv-facts-stack">
        <div>
          <dt>Role</dt>
          <dd>{role}</dd>
        </div>
        <div>
          <dt>Signs you out at</dt>
          <dd>{clockTime(expiresAt)}</dd>
        </div>
      </dl>
    </div>
  );
}

function Team({ staff, failed }: { staff: UserResponse[] | null; failed: boolean }) {
  return (
    <Card
      title="Team"
      span={8}
      index={13}
      action={
        <Link className="dv-link" href="/admin/users">
          All staff
        </Link>
      }
    >
      {(inView) => {
        if (failed)
          return <p className="dv-empty">The staff list couldn&apos;t be loaded. Refresh the page to try again.</p>;
        if (!staff) return <Skeleton h={96} />;
        const active = staff.filter((s) => s.isActive);
        const supers = active.filter((s) => s.role === "SuperAdmin").length;
        const recent = [...staff]
          .filter((s) => s.lastLoginAt)
          .sort((a, b) => b.lastLoginAt!.localeCompare(a.lastLoginAt!))
          .slice(0, 4);
        return (
          <div className="dv-team">
            <div>
              <dl className="dv-facts">
                <div>
                  <dt>Active</dt>
                  <dd>{active.length}</dd>
                </div>
                <div>
                  <dt>Deactivated</dt>
                  <dd>{staff.length - active.length}</dd>
                </div>
              </dl>
              <Stack
                start={inView}
                segments={[
                  { key: "s", label: "Super admins", value: supers, color: "#0b1726" },
                  { key: "o", label: "Operators", value: active.length - supers, color: "#7da3d6" },
                ]}
              />
              <p className="dv-card-note">
                {supers} super {supers === 1 ? "admin" : "admins"}, {active.length - supers}{" "}
                {active.length - supers === 1 ? "operator" : "operators"}.
              </p>
            </div>
            <ul className="dv-list dv-list-tight">
              {recent.length === 0 && <li className="dv-empty">Nobody has signed in yet.</li>}
              {recent.map((p) => (
                <li key={p.id}>
                  <div className="dv-row">
                    <span className="dv-avatar" aria-hidden="true">
                      {initials(p.username)}
                    </span>
                    <span className="dv-list-text">
                      <strong>{p.username}</strong>
                      <small>{roleLabel(p.role)}</small>
                    </span>
                    <time className="dv-age is-fresh" dateTime={p.lastLoginAt!} title={fullDate(p.lastLoginAt!)}>
                      {timeAgo(p.lastLoginAt!)}
                    </time>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      }}
    </Card>
  );
}

/* ── the page ──────────────────────────────────────────────────────────────────────────────────── */

function Loading() {
  return (
    <div className="dv-grid" aria-busy="true" aria-label="Loading the overview">
      <div className="dv-kpis">
        {[0, 1, 2, 3].map((i) => (
          <div className="dv-kpi" key={i}>
            <Skeleton h={14} w="45%" />
            <Skeleton h={38} w="60%" />
            <Skeleton h={12} w="80%" />
          </div>
        ))}
      </div>
      <div className="dv-card dv-span-8">
        <Skeleton h={300} />
      </div>
      <div className="dv-card dv-span-4">
        <Skeleton h={300} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, isSuperAdmin } = useAuth();
  const [days, setDays] = useState(30);
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [busy, setBusy] = useState(true);
  const [failed, setFailed] = useState(false);
  const [showPrevious, setShowPrevious] = useState(true);
  const [staff, setStaff] = useState<UserResponse[] | null>(null);
  const [staffFailed, setStaffFailed] = useState(false);

  const load = useCallback((period: number) => {
    setBusy(true);
    setFailed(false);
    dashboardApi
      .get(period)
      .then((d) => setData(d))
      .catch(() => setFailed(true))
      .finally(() => setBusy(false));
  }, []);

  useEffect(() => load(days), [days, load]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    usersApi
      .list()
      .then(setStaff)
      .catch(() => setStaffFailed(true));
  }, [isSuperAdmin]);

  const chart = useMemo(() => (data ? seriesPoints(data) : null), [data]);
  const period = PERIODS.find((p) => p.days === days)?.label ?? `${days} days`;

  return (
    <>
      <div className="dv-head">
        <div>
          <h1 className="dv-title">Overview</h1>
          <p className="dv-sub">
            {data ? (
              <>
                Updated <time dateTime={data.generatedAt}>{clockTime(data.generatedAt)}</time>
                <button type="button" className="dv-refresh" onClick={() => load(days)} disabled={busy}>
                  {busy ? "Refreshing" : "Refresh"}
                </button>
              </>
            ) : (
              "Enquiries, the catalogue and the team."
            )}
          </p>
        </div>
        <div className="dv-head-actions">
          <Segmented value={days} onChange={setDays} busy={busy} />
          {isSuperAdmin && (
            <Link className="btn btn-primary" href="/admin/users/invite">
              <i className="fa-solid fa-plus" aria-hidden="true"></i>
              Invite staff
            </Link>
          )}
        </div>
      </div>

      {failed && !data && (
        <div className="dv-card dv-error" role="alert">
          <h2 className="dv-card-title">The numbers couldn&apos;t be loaded</h2>
          <p className="dv-card-note">Something went wrong on our side.</p>
          <button type="button" className="btn btn-quiet" onClick={() => load(days)}>
            Try again
          </button>
        </div>
      )}

      {!data && !failed && <Loading />}

      {data && chart && (
        <div className={`dv-grid${busy ? " is-busy" : ""}`}>
          <Kpis data={data} />

          <Card
            title="Enquiries over time"
            note={`The last ${period}${showPrevious ? ", against the period before." : "."}`}
            span={8}
            index={4}
            action={
              <label className="dv-switch">
                <input type="checkbox" checked={showPrevious} onChange={(e) => setShowPrevious(e.target.checked)} />
                <span aria-hidden="true" />
                Compare
              </label>
            }
          >
            {(inView) => (
              <>
                <AreaChart
                  points={chart.points}
                  start={inView}
                  replayKey={data.generatedAt}
                  showPrevious={showPrevious}
                  unit={chart.unit}
                />
                <ul className="dv-key">
                  <li>
                    <i className="is-now" aria-hidden="true" />
                    This period
                  </li>
                  {showPrevious && (
                    <li>
                      <i className="is-before" aria-hidden="true" />
                      The period before
                    </li>
                  )}
                  {days > 90 && <li className="dv-key-note">Weekly totals</li>}
                </ul>
              </>
            )}
          </Card>

          <Pipeline data={data} />
          <ByType data={data} />
          <ByProduct data={data} />
          <Weekdays data={data} />
          <Awaiting data={data} />
          <TopPackages data={data} />
          <ToFix data={data} />
          <Catalogue data={data} />

          {isSuperAdmin && <Team staff={staff} failed={staffFailed} />}
          {user && <Session expiresAt={user.expiresAt} role={roleLabel(user.role)} />}
        </div>
      )}
    </>
  );
}
