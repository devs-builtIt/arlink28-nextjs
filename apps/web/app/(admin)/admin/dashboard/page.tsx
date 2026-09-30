"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { UserResponse } from "@arlink28/api-client";
import ProtectedPage from "@/components/ProtectedPage";
import PageHead from "@/components/admin/PageHead";
import { useAuth } from "@/context/AuthContext";
import { usersApi } from "@/utils/api/users";
import { clockTime, fullDate, initials, roleLabel, timeAgo } from "@/components/admin/format";

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
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/** Ring showing how much of the 8-hour session is left. */
function SessionCard({ expiresAt, role }: { expiresAt: string; role: string }) {
  const now = useNow();
  const left = new Date(expiresAt).getTime() - now;
  const share = Math.min(1, Math.max(0, left / SESSION_MS));
  const r = 52;
  const c = 2 * Math.PI * r;

  return (
    <section className="card card-session" aria-labelledby="session-title">
      <h2 className="card-title" id="session-title">
        Your session
      </h2>
      <div className="session">
        <svg className="ring" viewBox="0 0 128 128" role="img" aria-label={`${formatLeft(left)} left`}>
          <circle className="ring-track" cx="64" cy="64" r={r} />
          <circle
            className="ring-fill"
            cx="64"
            cy="64"
            r={r}
            strokeDasharray={c}
            strokeDashoffset={c * (1 - share)}
            transform="rotate(-90 64 64)"
          />
          <text x="64" y="62" textAnchor="middle" className="ring-value">
            {formatLeft(left)}
          </text>
          <text x="64" y="82" textAnchor="middle" className="ring-label">
            left
          </text>
        </svg>
        <dl className="mini-facts">
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
    </section>
  );
}

function StaffCards({ staff, failed }: { staff: UserResponse[] | null; failed: boolean }) {
  if (failed) {
    return (
      <section className="card card-wide">
        <h2 className="card-title">Staff</h2>
        <p className="card-note">The staff list couldn&apos;t be loaded. Refresh the page to try again.</p>
      </section>
    );
  }
  if (!staff) {
    return (
      <section className="card card-wide" aria-busy="true">
        <h2 className="card-title">Staff</h2>
        <p className="card-note">Loading staff…</p>
      </section>
    );
  }

  const active = staff.filter((s) => s.isActive);
  const supers = active.filter((s) => s.role === "SuperAdmin").length;
  const operators = active.length - supers;
  const recent = [...staff]
    .filter((s) => s.lastLoginAt)
    .sort((a, b) => b.lastLoginAt!.localeCompare(a.lastLoginAt!))
    .slice(0, 5);

  return (
    <>
      <section className="card" aria-labelledby="accounts-title">
        <h2 className="card-title" id="accounts-title">
          Staff accounts
        </h2>
        <p className="count">
          {active.length} <span>active</span>
        </p>
        <div
          className="bar"
          role="img"
          aria-label={`${active.length} of ${staff.length} accounts active`}
          style={{ "--share": `${staff.length ? (active.length / staff.length) * 100 : 0}%` } as React.CSSProperties}
        ></div>
        <ul className="tiles">
          <li>
            <span>Total</span>
            <strong>{staff.length}</strong>
          </li>
          <li>
            <span>Deactivated</span>
            <strong>{staff.length - active.length}</strong>
          </li>
        </ul>
      </section>

      <section className="card" aria-labelledby="roles-title">
        <h2 className="card-title" id="roles-title">
          Roles
        </h2>
        <ul className="split">
          <li>
            <div className="split-row">
              <span>Super admins</span>
              <strong>{supers}</strong>
            </div>
            <div
              className="bar bar-thin"
              style={{ "--share": `${active.length ? (supers / active.length) * 100 : 0}%` } as React.CSSProperties}
            ></div>
          </li>
          <li>
            <div className="split-row">
              <span>Operators</span>
              <strong>{operators}</strong>
            </div>
            <div
              className="bar bar-thin bar-navy"
              style={{ "--share": `${active.length ? (operators / active.length) * 100 : 0}%` } as React.CSSProperties}
            ></div>
          </li>
        </ul>
        <p className="card-note">Active accounts only.</p>
      </section>

      <section className="card card-wide" aria-labelledby="recent-title">
        <div className="card-head">
          <h2 className="card-title" id="recent-title">
            Recent sign-ins
          </h2>
          <Link className="btn btn-quiet btn-s" href="/admin/users">
            All staff
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="card-note">Nobody has signed in yet.</p>
        ) : (
          <ul className="people">
            {recent.map((p) => (
              <li key={p.id}>
                <span className="person-tile" aria-hidden="true">
                  {initials(p.username)}
                </span>
                <span className="people-name">
                  {p.username}
                  <small>{roleLabel(p.role)}</small>
                </span>
                <time className="muted" dateTime={p.lastLoginAt!} title={fullDate(p.lastLoginAt!)}>
                  {timeAgo(p.lastLoginAt!)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

export default function DashboardPage() {
  const { user, isSuperAdmin } = useAuth();
  const [staff, setStaff] = useState<UserResponse[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!isSuperAdmin) return;
    usersApi
      .list()
      .then(setStaff)
      .catch(() => setFailed(true));
  }, [isSuperAdmin]);

  return (
    <ProtectedPage>
      <PageHead
        title="Overview"
        intro={user && <>Signed in as {user.username}.</>}
        actions={
          isSuperAdmin && (
            <>
              <Link className="btn btn-quiet" href="/admin/users">
                Manage staff
              </Link>
              <Link className="btn btn-primary" href="/admin/users/invite">
                <i className="fa-solid fa-plus" aria-hidden="true"></i>
                Invite staff
              </Link>
            </>
          )
        }
      />

      <div className="cards">
        {user && <SessionCard expiresAt={user.expiresAt} role={roleLabel(user.role)} />}
        {isSuperAdmin && <StaffCards staff={staff} failed={failed} />}

        <section className="card" aria-labelledby="shortcuts-title">
          <h2 className="card-title" id="shortcuts-title">
            Shortcuts
          </h2>
          <ul className="shortcuts">
            {isSuperAdmin && (
              <li>
                <Link href="/admin/users/invite">
                  <span className="shortcut-icon" aria-hidden="true">
                    <i className="fa-solid fa-user-plus"></i>
                  </span>
                  <span>
                    Invite staff
                    <small>Email someone a link to set up an account</small>
                  </span>
                </Link>
              </li>
            )}
            <li>
              <Link href="/admin/change-password">
                <span className="shortcut-icon" aria-hidden="true">
                  <i className="fa-solid fa-key"></i>
                </span>
                <span>
                  Change password
                  <small>Update the password you sign in with</small>
                </span>
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </ProtectedPage>
  );
}
