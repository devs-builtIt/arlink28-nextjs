"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { DashboardResponse, EnquiryListItem, EnquiryStatus } from "@arlink28/api-client";
import { adminEnquiriesApi } from "@/utils/api/enquiries";
import { initials, money, timeAgo } from "@/components/admin/format";
import { Pagination } from "@/components/admin/ui";
import { BarList, Count, Sparkline } from "./charts";
import { useInView } from "./motion";
import { Card, Delta, PERIODS, PRODUCT, TYPE, duration, seriesPoints } from "./shared";

/** One headline figure: the label, the number, then a tinted pill and, where there is a series, its line. */
function Kpi({
  index,
  tone,
  label,
  alert,
  href,
  children,
  pill,
  spark,
}: {
  index: number;
  tone: "blue" | "red" | "green" | "amber";
  label: string;
  alert?: boolean;
  /** Makes the whole card a link. */
  href?: string;
  children: React.ReactNode;
  pill: React.ReactNode;
  spark?: React.ReactNode;
}) {
  const className = `dv-kpi is-${tone}${alert ? " is-alert" : ""}${href ? " is-link" : ""}`;
  const body = (
    <>
      <span className="dv-kpi-label">{label}</span>
      {children}
      <div className="dv-kpi-row">
        {pill}
        {spark}
      </div>
    </>
  );
  const style = { ["--i" as string]: index };
  return href ? (
    <Link href={href} className={className} style={style}>
      {body}
    </Link>
  ) : (
    <div className={className} style={style}>
      {body}
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
        href="/admin/enquiries?status=New"
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

const PAGE_SIZE = 10;

/** The latest enquiries, with the two things staff do to one: mark it contacted, or close it. */
export function RecentEnquiries({ data }: { data: DashboardResponse }) {
  const [items, setItems] = useState<EnquiryListItem[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(() => {
    adminEnquiriesApi
      .list({ page, pageSize: PAGE_SIZE })
      .then((r) => {
        setItems(r.items);
        setTotal(r.total);
        setFailed(false);
      })
      .catch(() => setFailed(true));
  }, [page]);
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
      {() => (
        <>
          {failed && !items ? (
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
          )}
          {total > PAGE_SIZE && (
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} fixedSize noun="enquiries" onPage={setPage} />
          )}
        </>
      )}
    </Card>
  );
}

/** What people are asking for: a ranked bar for each, with how many enquiries and their share of the period. */
function Demand({
  title,
  note,
  items,
  empty,
  index,
}: {
  title: string;
  note: string;
  items: { key: string; label: string; value: number }[];
  empty: string;
  index: number;
}) {
  items = [...items].sort((a, b) => b.value - a.value);
  const total = items.reduce((sum, i) => sum + i.value, 0);
  const bars = items.map((i, n) => ({ ...i, color: n === 0 ? "#0b1726" : "#7da3d6" }));
  return (
    <Card title={title} note={note} index={index}>
      {(inView) =>
        items.length === 0 ? (
          <p className="dv-empty">{empty}</p>
        ) : (
          <>
            <BarList
              items={bars}
              start={inView}
              format={(n) => `${n} · ${Math.round((n / Math.max(1, total)) * 100)}%`}
            />
            <p className="dv-foot">
              <strong>{items[0].label}</strong> leads with {items[0].value}{" "}
              {items[0].value === 1 ? "enquiry" : "enquiries"}.
            </p>
          </>
        )
      }
    </Card>
  );
}

export function OverviewTab({ data }: { data: DashboardResponse }) {
  const e = data.enquiries;
  const period = PERIODS.find((p) => p.days === data.days)?.label ?? `${data.days} days`;
  return (
    <>
      <Kpis data={data} />
      <RecentEnquiries data={data} />
      <div className="dv-side">
        <Demand
          title="Top destinations"
          note={`Where people want to go, last ${period}.`}
          items={e.byDestination.map((d) => ({ key: d.name, label: d.name, value: d.count }))}
          empty="No enquiries about a listing in this period."
          index={5}
        />
        <Demand
          title="Top services"
          note={`What they are asking for, last ${period}.`}
          items={e.byProduct.map((p) => ({ key: p.product, label: PRODUCT[p.product] ?? p.product, value: p.count }))}
          empty="No enquiries in this period yet."
          index={6}
        />
      </div>
    </>
  );
}
