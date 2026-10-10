"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { DashboardResponse, EnquiryListItem, EnquiryStatus } from "@arlink28/api-client";
import { adminEnquiriesApi } from "@/utils/api/enquiries";
import { fullDate, initials, money, timeAgo } from "@/components/admin/format";
import { Count, Sparkline } from "./charts";
import { useInView } from "./motion";
import { Card, Delta, PERIODS, PRODUCT, TYPE, ageTone, duration, seriesPoints } from "./shared";

/** One headline figure: the label, the number, then a tinted pill and, where there is a series, its line. */
function Kpi({
  index,
  tone,
  label,
  alert,
  children,
  pill,
  spark,
}: {
  index: number;
  tone: "blue" | "red" | "green" | "amber";
  label: string;
  alert?: boolean;
  children: React.ReactNode;
  pill: React.ReactNode;
  spark?: React.ReactNode;
}) {
  return (
    <div className={`dv-kpi is-${tone}${alert ? " is-alert" : ""}`} style={{ ["--i" as string]: index }}>
      <span className="dv-kpi-label">{label}</span>
      {children}
      <div className="dv-kpi-row">
        {pill}
        {spark}
      </div>
    </div>
  );
}

export function Kpis({ data }: { data: DashboardResponse }) {
  const e = data.enquiries;
  const [ref, inView] = useInView<HTMLDivElement>();
  const { values } = seriesPoints(data);
  const period = PERIODS.find((p) => p.days === data.days)?.label ?? `${data.days} days`;
  const oldest = e.awaiting[0];
  const quoted = e.quoted[0];
  const handled = e.contacted + e.closed;

  return (
    <div className="dv-kpis" ref={ref}>
      <Kpi
        index={0}
        tone="blue"
        label={`Enquiries, ${period}`}
        pill={<Delta now={e.total} before={e.previousTotal} />}
        spark={<Sparkline values={values} start={inView} label={`Enquiries over the last ${period}`} />}
      >
        <Count value={e.total} start={inView} />
      </Kpi>

      <Kpi
        index={1}
        tone="red"
        label="Waiting for a reply"
        alert={e.awaitingAll > 0}
        pill={<span className="dv-pill">{oldest ? `Oldest ${timeAgo(oldest.createdAt)}` : "All replied to"}</span>}
      >
        <Count value={e.awaitingAll} start={inView} />
      </Kpi>

      <Kpi index={2} tone="green" label="Time to act" pill={<span className="dv-pill">{handled} handled</span>}>
        <span className="dv-num">{e.medianHandleHours === null ? "—" : duration(e.medianHandleHours)}</span>
      </Kpi>

      <Kpi
        index={3}
        tone="amber"
        label="Quoted"
        pill={
          <span className="dv-pill">
            {quoted ? `${quoted.count} ${quoted.count === 1 ? "quote" : "quotes"}` : "No quotes yet"}
          </span>
        }
      >
        {quoted ? (
          <Count
            value={quoted.totalMinor / 100}
            start={inView}
            format={(n) => money(Math.round(n) * 100, quoted.currency)}
          />
        ) : (
          <span className="dv-num">—</span>
        )}
      </Kpi>
    </div>
  );
}

const STATUS_TONE: Record<EnquiryStatus, string> = { New: "blue", Contacted: "amber", Closed: "green" };
const KIND_TONE: Record<string, string> = {
  HolidayPackage: "green",
  Flight: "blue",
  HotelReservation: "amber",
  VisaSupport: "slate",
  PrivateCharter: "red",
};

/** The latest enquiries, with the two things staff do to one: mark it contacted, or close it. */
export function RecentEnquiries({ data }: { data: DashboardResponse }) {
  const [items, setItems] = useState<EnquiryListItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(() => {
    adminEnquiriesApi
      .list({ pageSize: 7 })
      .then((r) => {
        setItems(r.items);
        setFailed(false);
      })
      .catch(() => setFailed(true));
  }, []);
  useEffect(load, [load, data.generatedAt]);

  const move = (id: string, status: EnquiryStatus) => {
    setSaving(id);
    adminEnquiriesApi
      .setStatus(id, status)
      .then(load)
      .catch(() => setFailed(true))
      .finally(() => setSaving(null));
  };

  return (
    <Card
      title="Recent enquiries"
      span={8}
      index={4}
      className="dv-table-card"
      action={
        <Link className="dv-link" href="/admin/enquiries">
          View all
        </Link>
      }
    >
      {() =>
        failed && !items ? (
          <p className="dv-empty">The latest enquiries couldn&apos;t be loaded.</p>
        ) : !items ? (
          <p className="dv-empty">Loading…</p>
        ) : items.length === 0 ? (
          <p className="dv-empty">No enquiries yet.</p>
        ) : (
          <div className="dv-table-wrap">
            <table className="dv-enq">
              <thead>
                <tr>
                  <th scope="col">Enquiry</th>
                  <th scope="col">About</th>
                  <th scope="col">Quote</th>
                  <th scope="col">Status</th>
                  <th scope="col">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => {
                  const kind = r.productType ?? "";
                  return (
                    <tr key={r.id}>
                      <td>
                        <Link href={`/admin/enquiries/${r.id}`} className="dv-who">
                          <span className="dv-avatar" aria-hidden="true">
                            {initials(r.name)}
                          </span>
                          <span className="dv-list-text">
                            <strong>{r.name}</strong>
                            <small>{r.packageTitle ?? r.subject ?? r.reference}</small>
                          </span>
                        </Link>
                      </td>
                      <td>
                        <span className={`dv-tone is-${KIND_TONE[kind] ?? "slate"}`}>
                          {PRODUCT[kind] ?? TYPE[r.type] ?? r.type}
                        </span>
                      </td>
                      <td className="dv-nowrap">
                        {r.quotedTotalMinor ? money(r.quotedTotalMinor, r.currency ?? "USD") : "—"}
                      </td>
                      <td>
                        <span className={`dv-tone is-${STATUS_TONE[r.status]}`}>{r.status}</span>
                      </td>
                      <td>
                        <span className="dv-acts">
                          <button
                            type="button"
                            className="dv-act"
                            aria-label={`Mark ${r.name} contacted`}
                            title="Mark contacted"
                            disabled={r.status !== "New" || saving === r.id}
                            onClick={() => move(r.id, "Contacted")}
                          >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <path d="m6 12.5 4 4 8-9" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="dv-act"
                            aria-label={`Close ${r.name}`}
                            title="Close"
                            disabled={r.status === "Closed" || saving === r.id}
                            onClick={() => move(r.id, "Closed")}
                          >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <path d="m7 7 10 10M17 7 7 17" />
                            </svg>
                          </button>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
      span={4}
      index={5}
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

export function OverviewTab({ data }: { data: DashboardResponse }) {
  return (
    <>
      <Kpis data={data} />
      <RecentEnquiries data={data} />
      <Awaiting data={data} />
    </>
  );
}
