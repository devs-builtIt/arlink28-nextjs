"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { DashboardResponse } from "@arlink28/api-client";
import { useAuth } from "@/context/AuthContext";
import { dashboardApi } from "@/utils/api/dashboard";
import { clockTime, firstName, greeting } from "@/components/admin/format";
import { Skeleton } from "@/components/admin/ui";
import { OverviewTab } from "./OverviewTab";
import { Segmented } from "./shared";

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

  return (
    <>
      <div className="dv-head">
        <div>
          <h1 className="dv-title">
            {greeting()}, {user ? firstName(user.username) : "welcome"}
          </h1>
          <p className="dv-sub">
            {data ? (
              <>
                Updated <time dateTime={data.generatedAt}>{clockTime(data.generatedAt)}</time>
                <button type="button" className="dv-refresh" onClick={() => load(days)} disabled={busy}>
                  {busy ? "Refreshing" : "Refresh"}
                </button>
              </>
            ) : (
              "The agency at a glance."
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

      {data && (
        <div className={`dv-grid${busy ? " is-busy" : ""}`}>
          <OverviewTab data={data} />
        </div>
      )}
    </>
  );
}
