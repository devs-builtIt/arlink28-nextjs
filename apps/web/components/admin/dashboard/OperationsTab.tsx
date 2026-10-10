"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { DashboardResponse, UserResponse } from "@arlink28/api-client";
import { clockTime, fullDate, initials, roleLabel, timeAgo } from "@/components/admin/format";
import { Skeleton } from "@/components/admin/ui";
import { useAuth } from "@/context/AuthContext";
import { BarList, Count, Ring, Stack } from "./charts";
import { useReveal } from "./motion";
import { samplePayments, sampleVisas } from "./placeholders";
import { CATALOGUE_COLORS, Card, PRODUCT, Stat, usd } from "./shared";

export function Catalogue({ data }: { data: DashboardResponse }) {
  const c = data.catalogue;
  const published = c.byProduct.reduce((s, p) => s + p.published, 0);
  const drafts = c.byProduct.reduce((s, p) => s + p.draft, 0);
  return (
    <Card
      title="Catalogue"
      note="What is live on the site, by service."
      span={8}
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

export function ToFix({ data }: { data: DashboardResponse }) {
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

export function Session({ expiresAt, role }: { expiresAt: string; role: string }) {
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

export function Team({ staff, failed }: { staff: UserResponse[] | null; failed: boolean }) {
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

/* ── trips, workload, visas and payments ───────────────────────────────────────────────────────── */

const inDays = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return Math.round((new Date(y, m - 1, d).getTime() - start) / 86_400_000);
};
const when = (days: number) => (days <= 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days} days`);
const shortDay = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
};

export function Upcoming({ data }: { data: DashboardResponse }) {
  const trips = data.enquiries.upcoming;
  return (
    <Card
      title="Upcoming trips"
      note="By check-in date, from the enquiries that have one."
      span={8}
      index={5}
      action={
        <Link className="dv-link" href="/admin/enquiries">
          All enquiries
        </Link>
      }
    >
      {() =>
        trips.length === 0 ? (
          <p className="dv-empty">No enquiry has a check-in date coming up.</p>
        ) : (
          <ul className="dv-list">
            {trips.map((t) => {
              const days = inDays(t.checkIn);
              return (
                <li key={t.id}>
                  <Link href={`/admin/enquiries/${t.id}`}>
                    <span className="dv-datebox" aria-hidden="true">
                      <small>
                        {new Date(t.checkIn + "T00:00:00").toLocaleDateString(undefined, { month: "short" })}
                      </small>
                      <strong>{new Date(t.checkIn + "T00:00:00").getDate()}</strong>
                    </span>
                    <span className="dv-list-text">
                      <strong>{t.name}</strong>
                      <small>
                        {t.packageTitle ?? "General enquiry"}
                        {t.nights ? ` · ${t.nights} nights` : ""}
                      </small>
                    </span>
                    <span className={`dv-age ${days <= 7 ? "is-slow" : "is-fresh"}`} title={shortDay(t.checkIn)}>
                      {when(days)}
                    </span>
                    <span className={`dv-status is-${t.status.toLowerCase()}`}>{t.status}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )
      }
    </Card>
  );
}

export function StaffLoad({ data }: { data: DashboardResponse }) {
  const staff = data.enquiries.staff;
  const items = staff.map((s, i) => ({
    key: s.id,
    label: s.username,
    value: s.handled,
    sub: `${s.closed} closed`,
    color: i === 0 ? "#0b1726" : "#7da3d6",
  }));
  return (
    <Card title="Who is handling what" note="Enquiries each person has acted on." span={4} index={6}>
      {(inView) =>
        items.length === 0 ? (
          <p className="dv-empty">Nobody has handled an enquiry in this period.</p>
        ) : (
          <BarList items={items} start={inView} />
        )
      }
    </Card>
  );
}

export function VisaPipeline() {
  const v = sampleVisas;
  const top = Math.max(...v.stages.map((s) => s.count));
  return (
    <Card
      title="Visa applications"
      note="Where each application is in processing."
      span={4}
      index={7}
      sample="visa applications"
    >
      {(inView) => (
        <>
          <VisaBody stages={v.stages} top={top} inView={inView} />
          <dl className="dv-facts dv-facts-tight">
            <div>
              <dt>Average time</dt>
              <dd>{v.averageDays} days</dd>
            </div>
            <div>
              <dt>Approved</dt>
              <dd>{Math.round(v.approvalRate * 100)}%</dd>
            </div>
          </dl>
        </>
      )}
    </Card>
  );
}

function VisaBody({
  stages,
  top,
  inView,
}: {
  stages: { key: string; label: string; count: number }[];
  top: number;
  inView: boolean;
}) {
  const progress = useReveal(inView, 1100);
  return (
    <ul className="dv-funnel">
      {stages.map((s, i) => {
        const local = Math.min(1, Math.max(0, progress * 1.4 - i * 0.18));
        return (
          <li key={s.key}>
            <div className="dv-funnel-row">
              <span>{s.label}</span>
              <strong>{s.count}</strong>
            </div>
            <div className="dv-track dv-track-lg">
              <div className="dv-fill dv-tone-steel" style={{ width: `${(s.count / top) * 100 * local}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function Payments() {
  const p = samplePayments;
  const total = p.collected + p.outstanding;
  const aging = p.aging.map((a, i) => ({
    key: a.key,
    label: a.label,
    value: a.amount,
    color: ["#7da3d6", "#d4b078", "#c98b3a", "#e61e2b"][i],
  }));
  return (
    <Card title="Payments" note="What has come in and what is still owed." span={8} index={8} sample="client payments">
      {(inView) => (
        <div className="dv-pay">
          <div className="dv-pay-ring">
            <Ring
              value={p.collected / total}
              start={inView}
              centre={`${Math.round((p.collected / total) * 100)}%`}
              sub="collected"
              label={`${usd(p.collected)} collected of ${usd(total)}`}
              tone="green"
            />
            <dl className="dv-facts dv-facts-tight">
              <div>
                <dt>Collected</dt>
                <dd>{usd(p.collected)}</dd>
              </div>
              <div>
                <dt>Still owed</dt>
                <dd>{usd(p.outstanding)}</dd>
              </div>
            </dl>
          </div>
          <div>
            <p className="dv-sub-title">Still owed, by how late</p>
            <BarList items={aging} start={inView} format={usd} max={Math.max(...aging.map((a) => a.value))} />
          </div>
          <div>
            <p className="dv-sub-title">Due this week</p>
            <ul className="dv-list dv-list-tight">
              {p.dueThisWeek.map((d) => (
                <li key={d.id}>
                  <div className="dv-row">
                    <span className="dv-list-text">
                      <strong>{d.client}</strong>
                      <small>{d.detail}</small>
                    </span>
                    <span className="dv-money">{usd(d.amount)}</span>
                    <span className="dv-age is-slow">{d.due}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Card>
  );
}

export function OperationsTab({
  data,
  staff,
  staffFailed,
}: {
  data: DashboardResponse;
  staff: UserResponse[] | null;
  staffFailed: boolean;
}) {
  const { user, isSuperAdmin } = useAuth();
  const e = data.enquiries;
  const inProgress = sampleVisas.stages[0].count + sampleVisas.stages[1].count;
  const oldest = e.awaiting[0];
  return (
    <>
      <div className="dv-kpis">
        <Stat
          index={0}
          label="Trips in the next 30 days"
          value={<Count value={e.upcomingNext30} start />}
          sub="Enquiries with a check-in date in that time."
        />
        <Stat
          index={1}
          label="Waiting for a reply"
          alert={e.awaitingAll > 0}
          value={<Count value={e.awaitingAll} start />}
          sub={
            oldest ? (
              <>
                The oldest came in <strong>{timeAgo(oldest.createdAt)}</strong>.
              </>
            ) : (
              "Everything has had a reply."
            )
          }
        />
        <Stat
          index={2}
          sample
          label="Payments still owed"
          value={<Count value={samplePayments.outstanding} start format={usd} />}
          sub="Across open bookings."
        />
        <Stat
          index={3}
          sample
          label="Visas in progress"
          value={<Count value={inProgress} start />}
          sub={`${sampleVisas.averageDays} days on average to approve.`}
        />
      </div>

      <Upcoming data={data} />
      <StaffLoad data={data} />
      <VisaPipeline />
      <Payments />
      <Catalogue data={data} />
      <ToFix data={data} />
      {isSuperAdmin && <Team staff={staff} failed={staffFailed} />}
      {user && <Session expiresAt={user.expiresAt} role={roleLabel(user.role)} />}
    </>
  );
}
