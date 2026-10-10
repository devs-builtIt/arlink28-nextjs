"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { DashboardResponse, UserResponse } from "@arlink28/api-client";
import { useAuth } from "@/context/AuthContext";
import { dashboardApi } from "@/utils/api/dashboard";
import { usersApi } from "@/utils/api/users";
import { clockTime } from "@/components/admin/format";
import { Skeleton } from "@/components/admin/ui";
import { OperationsTab } from "./OperationsTab";
import { OverviewTab } from "./OverviewTab";
import { PartnersTab } from "./PartnersTab";
import { SalesTab } from "./SalesTab";
import { SampleBanner, SampleProvider, useSamplePreference } from "./sample";
import { Segmented } from "./shared";

const TABS = [
  { id: "overview", label: "Overview", about: "Enquiries and demand." },
  { id: "sales", label: "Sales", about: "Revenue, bookings and conversion.", sample: "Bookings and revenue" },
  {
    id: "operations",
    label: "Operations",
    about: "Trips, visas, payments and the team.",
    sample: "Visa applications and payments",
  },
  {
    id: "partners",
    label: "Partners & clients",
    about: "Suppliers, commission and client feedback.",
    sample: "Supplier commissions and client reviews",
  },
] as const;
type TabId = (typeof TABS)[number]["id"];

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

/** The four views of the agency. The choice lives in the address (#sales), so a refresh or a shared link keeps it. */
function useTab(): [TabId, (id: TabId) => void] {
  const [tab, setTab] = useState<TabId>("overview");
  useEffect(() => {
    const fromHash = window.location.hash.replace("#", "");
    if (TABS.some((t) => t.id === fromHash)) setTab(fromHash as TabId);
    const onHash = () => {
      const next = window.location.hash.replace("#", "");
      setTab(TABS.some((t) => t.id === next) ? (next as TabId) : "overview");
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const choose = (id: TabId) => {
    setTab(id);
    window.history.replaceState(null, "", id === "overview" ? window.location.pathname : `#${id}`);
  };
  return [tab, choose];
}

function Tabs({ value, onChange }: { value: TabId; onChange: (id: TabId) => void }) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const onKey = (e: React.KeyboardEvent, index: number) => {
    const next = e.key === "ArrowRight" ? index + 1 : e.key === "ArrowLeft" ? index - 1 : null;
    if (next === null) return;
    const target = TABS[(next + TABS.length) % TABS.length];
    onChange(target.id);
    refs.current[target.id]?.focus();
    e.preventDefault();
  };
  return (
    <div className="dv-tabs" role="tablist" aria-label="Dashboard sections">
      {TABS.map((t, i) => (
        <button
          key={t.id}
          ref={(el) => {
            refs.current[t.id] = el;
          }}
          type="button"
          role="tab"
          id={`dv-tab-${t.id}`}
          aria-selected={t.id === value}
          aria-controls="dv-panel"
          tabIndex={t.id === value ? 0 : -1}
          className={t.id === value ? "is-on" : undefined}
          onClick={() => onChange(t.id)}
          onKeyDown={(e) => onKey(e, i)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { isSuperAdmin } = useAuth();
  const [days, setDays] = useState(30);
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [busy, setBusy] = useState(true);
  const [failed, setFailed] = useState(false);
  const [staff, setStaff] = useState<UserResponse[] | null>(null);
  const [staffFailed, setStaffFailed] = useState(false);
  const [tab, setTab] = useTab();
  const [showSample, setShowSample] = useSamplePreference();

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

  const current = TABS.find((t) => t.id === tab) ?? TABS[0];

  return (
    <SampleProvider value={showSample}>
      <div className="dv-head">
        <div>
          <h1 className="dv-title">Dashboard</h1>
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

      <Tabs value={tab} onChange={setTab} />

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
        <div id="dv-panel" role="tabpanel" aria-labelledby={`dv-tab-${tab}`} aria-label={current.label}>
          {"sample" in current && <SampleBanner show={showSample} onChange={setShowSample} what={current.sample} />}
          <div className={`dv-grid${busy ? " is-busy" : ""}`} key={tab}>
            {tab === "overview" && <OverviewTab data={data} />}
            {tab === "sales" && <SalesTab data={data} />}
            {tab === "operations" && <OperationsTab data={data} staff={staff} staffFailed={staffFailed} />}
            {tab === "partners" && <PartnersTab data={data} />}
          </div>
        </div>
      )}
    </SampleProvider>
  );
}
