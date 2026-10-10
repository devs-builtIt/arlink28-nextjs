"use client";

import { useState } from "react";
import Link from "next/link";
import type { DashboardResponse } from "@arlink28/api-client";
import { fullDate, initials, money, timeAgo } from "@/components/admin/format";
import { AreaChart, BarList, Count, Donut, Sparkline, type Slice } from "./charts";
import { useCountUp, useInView, useReveal } from "./motion";
import { Card, Delta, PALETTE, PERIODS, TYPE, ageTone, duration, seriesPoints } from "./shared";

export function Kpis({ data }: { data: DashboardResponse }) {
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

export function Pipeline({ data }: { data: DashboardResponse }) {
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

export function ByType({ data }: { data: DashboardResponse }) {
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

export function Awaiting({ data }: { data: DashboardResponse }) {
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

export function EnquiryChart({ data }: { data: DashboardResponse }) {
  const [showPrevious, setShowPrevious] = useState(true);
  const chart = seriesPoints(data);
  const days = data.days;
  const period = PERIODS.find((p) => p.days === days)?.label ?? `${days} days`;
  return (
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
  );
}

export function Destinations({ data }: { data: DashboardResponse }) {
  const items = data.enquiries.byDestination.map((d, i) => ({
    key: d.name,
    label: d.name,
    value: d.count,
    color: i === 0 ? "#0b1726" : "#7da3d6",
  }));
  return (
    <Card title="Where people want to go" note="Enquiries about a listing, by destination." span={4} index={10}>
      {(inView) =>
        items.length === 0 ? (
          <p className="dv-empty">No enquiries about a listing in this period.</p>
        ) : (
          <BarList items={items} start={inView} />
        )
      }
    </Card>
  );
}

export function OverviewTab({ data }: { data: DashboardResponse }) {
  return (
    <>
      <Kpis data={data} />
      <EnquiryChart data={data} />
      <Awaiting data={data} />
      <Pipeline data={data} />
      <ByType data={data} />
      <Destinations data={data} />
    </>
  );
}
