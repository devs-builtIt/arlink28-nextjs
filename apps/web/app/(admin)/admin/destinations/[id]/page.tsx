"use client";

import { Suspense, useEffect, useState, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import type { AdminDestinationDetail } from "@arlink28/api-client";
import ProtectedPage from "@/components/ProtectedPage";
import Notice from "@/components/admin/Notice";
import AttractionsEditor from "@/components/admin/destinations/AttractionsEditor";
import DestinationForm from "@/components/admin/destinations/DestinationForm";
import DestinationPublishPanel from "@/components/admin/destinations/DestinationPublishPanel";
import HeroEditor from "@/components/admin/destinations/HeroEditor";
import { fullDate, timeAgo } from "@/components/admin/format";
import { Crumbs, Panel, Skeleton, StatusBadge } from "@/components/admin/ui";
import { ApiError } from "@/utils/api/client";
import { adminDestinationsApi } from "@/utils/api/destinations";
import { countryName } from "@/utils/destinations";

type TabId = "details" | "photos" | "attractions" | "places";

const tabsFor = (d: AdminDestinationDetail): { id: TabId; label: string; count?: number }[] => [
  { id: "details", label: "Details" },
  { id: "photos", label: "Photo" },
  { id: "attractions", label: "Things to do", count: d.attractions.length },
  ...(d.kind === "Country" ? [{ id: "places" as const, label: "Places", count: d.places.length }] : []),
];

/** What a draft needs before it can go live, and the tab where each is fixed. The wording is the API's. */
function readiness(d: AdminDestinationDetail): { label: string; met: boolean; tab: TabId }[] {
  const needs: { label: string; tab: TabId }[] = [
    { label: "A hero photo", tab: "photos" },
    { label: "A summary", tab: "details" },
    d.kind === "Country"
      ? { label: "At least one published place", tab: "places" }
      : { label: "At least one attraction", tab: "attractions" },
  ];
  return needs.map((n) => ({ ...n, met: !d.missing.includes(n.label) }));
}

function TabStrip({
  tabs,
  active,
  onSelect,
}: {
  tabs: ReturnType<typeof tabsFor>;
  active: TabId;
  onSelect: (id: TabId) => void;
}) {
  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const index = tabs.findIndex((t) => t.id === active);
    const next = tabs[(index + step + tabs.length) % tabs.length];
    onSelect(next.id);
    document.getElementById(`tab-${next.id}`)?.focus();
  }

  return (
    <div className="pk-jump" role="tablist" aria-label="Sections" onKeyDown={onKeyDown}>
      {tabs.map((t) => (
        <button
          key={t.id}
          id={`tab-${t.id}`}
          type="button"
          role="tab"
          aria-selected={active === t.id}
          aria-controls={`panel-${t.id}`}
          tabIndex={active === t.id ? 0 : -1}
          onClick={() => onSelect(t.id)}
        >
          {t.label}
          {t.count !== undefined && t.count > 0 && <span className="pk-tab-count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

/** A tab's content. Hidden tabs stay mounted, so nothing typed in one is lost by looking at another. */
function TabPanel({ id, active, children }: { id: TabId; active: TabId; children: ReactNode }) {
  return (
    <div
      role="tabpanel"
      id={`panel-${id}`}
      aria-labelledby={`tab-${id}`}
      hidden={active !== id}
      className="pk-sections"
    >
      {children}
    </div>
  );
}

function EditSkeleton() {
  return (
    <div className="pk" role="status" aria-label="Loading destination">
      <div className="pk-header">
        <div className="pk-stack" style={{ gap: 14 }}>
          <Skeleton w={220} h={13} />
          <Skeleton w={340} h={28} />
          <Skeleton w={420} h={14} />
        </div>
      </div>
      <div className="pk-edit">
        <div className="pk-sections">
          <div className="pk-panel-outer">
            <div className="pk-panel" data-split>
              <div className="pk-panel-head">
                <div className="pk-stack" style={{ gap: 10 }}>
                  <Skeleton w={120} h={16} />
                  <Skeleton w={200} h={12} />
                </div>
              </div>
              <div className="pk-panel-body">
                <div className="pk-stack" style={{ gap: 18 }}>
                  {Array.from({ length: 4 }, (_, n) => (
                    <div className="pk-stack" key={n} style={{ gap: 8 }}>
                      <Skeleton w={110} h={12} />
                      <Skeleton w="100%" h={36} r={6} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="pk-rail">
          <div className="card">
            <div className="pk-stack" style={{ gap: 12 }}>
              <Skeleton w={70} h={14} />
              <Skeleton w={110} h={22} r={6} />
              <Skeleton w="100%" h={36} r={6} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DestinationEditor() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [dest, setDest] = useState<AdminDestinationDetail | null>(null);
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);

  useEffect(() => {
    adminDestinationsApi
      .get(id)
      .then(setDest)
      .catch((err) =>
        setError({
          message: err instanceof Error ? err.message : "The destination couldn't be loaded.",
          status: err instanceof ApiError ? err.status : undefined,
        }),
      );
  }, [id]);

  // The address holds the tab, so a refresh or a shared link opens the same one.
  const tabs = dest ? tabsFor(dest) : [];
  const requested = params.get("tab");
  const tab: TabId = tabs.some((t) => t.id === requested) ? (requested as TabId) : "details";
  function selectTab(next: TabId) {
    const query = new URLSearchParams(params.toString());
    if (next === "details") query.delete("tab");
    else query.set("tab", next);
    const qs = query.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  if (error) {
    return (
      <ProtectedPage wide>
        <div className="pk">
          <Crumbs trail={[{ label: "Destinations", href: "/admin/destinations" }, { label: "Destination" }]} />
          <Notice tone="error">{error.status === 404 ? "This destination doesn't exist." : error.message}</Notice>
          <Link className="btn btn-quiet" href="/admin/destinations">
            Back to destinations
          </Link>
        </div>
      </ProtectedPage>
    );
  }

  if (!dest) {
    return (
      <ProtectedPage wide>
        <EditSkeleton />
      </ProtectedPage>
    );
  }

  const isCountry = dest.kind === "Country";
  const checks = readiness(dest);
  const outstanding = checks.filter((c) => !c.met);

  return (
    <ProtectedPage wide>
      <div className="pk">
        <Crumbs
          trail={[
            { label: "Destinations", href: "/admin/destinations" },
            ...(dest.parentId && dest.parentName
              ? [{ label: dest.parentName, href: `/admin/destinations/${dest.parentId}` }]
              : []),
            { label: dest.name },
          ]}
        />
        <div className="pk-header">
          <div>
            <div className="pk-heading">
              <h1 className="pk-title">{dest.name}</h1>
              <StatusBadge status={dest.status} />
            </div>
            <p className="pk-meta">
              <span>{isCountry ? "Country" : `Place in ${dest.parentName ?? countryName(dest.country)}`}</span>
              <span>/{dest.slug}</span>
              <span title={fullDate(dest.updatedAt)}>Updated {timeAgo(dest.updatedAt)}</span>
              {dest.status === "Published" && (
                <span>
                  <a className="pk-link" href={`/destinations/${dest.slug}`} target="_blank" rel="noreferrer">
                    View on the site
                  </a>
                </span>
              )}
            </p>
          </div>
        </div>

        <TabStrip tabs={tabs} active={tab} onSelect={selectTab} />

        <div className="pk-edit">
          <div className="pk-tabpanels">
            <TabPanel id="details" active={tab}>
              <Panel id="details" title="Details" description="The name, address and the lines visitors read first.">
                <DestinationForm destination={dest} part="core" onSaved={setDest} />
              </Panel>
              <Panel id="story" title="Write-up" description="The longer description, and when to go.">
                <DestinationForm destination={dest} part="story" onSaved={setDest} />
              </Panel>
              <Panel
                id="position"
                title="Position and order"
                description="Where it is, and where it sits on the destinations page."
              >
                <DestinationForm destination={dest} part="position" onSaved={setDest} />
              </Panel>
            </TabPanel>

            <TabPanel id="photos" active={tab}>
              <Panel
                id="hero"
                title="Main photo"
                description="Leads the destination page and its card. Needed before it can be published."
              >
                <HeroEditor destination={dest} onChange={setDest} />
              </Panel>
            </TabPanel>

            <TabPanel id="attractions" active={tab}>
              <Panel
                id="things"
                title="Things to do"
                description="What is worth seeing or doing here, in the order visitors read it."
              >
                <AttractionsEditor destination={dest} onChange={setDest} />
              </Panel>
            </TabPanel>

            {isCountry && (
              <TabPanel id="places" active={tab}>
                <Panel id="places" title="Places" description="The places inside this country. Each has its own page.">
                  {dest.places.length === 0 ? (
                    <p className="empty photos-empty">
                      No places yet. A country needs one published place before it can go live.
                    </p>
                  ) : (
                    <ul className="pk-dest-places" aria-label="Places">
                      {dest.places.map((p) => (
                        <li key={p.id}>
                          <Link href={`/admin/destinations/${p.id}`}>{p.name}</Link>
                          <StatusBadge status={p.status} />
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="pk-dest-add">
                    <Link className="btn btn-quiet" href={`/admin/destinations/new?parent=${dest.id}`}>
                      <i className="fa-solid fa-plus" aria-hidden="true"></i>
                      Add a place in {dest.name}
                    </Link>
                  </div>
                </Panel>
              </TabPanel>
            )}
          </div>

          <aside className="pk-rail">
            <DestinationPublishPanel destination={dest} onChange={setDest} />

            {dest.status !== "Published" && (
              <section className="pk-summary" aria-labelledby="ready-title">
                <h2 id="ready-title">Ready to publish</h2>
                <div className="pk-check">
                  <ul>
                    {checks.map((c) => (
                      <li key={c.label} data-met={c.met || undefined}>
                        <i className={`fa-solid ${c.met ? "fa-circle-check" : "fa-circle"}`} aria-hidden="true"></i>
                        {c.met ? (
                          <span>
                            {c.label}
                            <span className="sr-only">, done</span>
                          </span>
                        ) : (
                          <button type="button" className="pk-link" onClick={() => selectTab(c.tab)}>
                            {c.label}
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                  <p className="pk-check-note">
                    {outstanding.length === 0
                      ? "Everything needed is in. Publish when you're ready."
                      : `${outstanding.length} still needed. Select one to go to it.`}
                  </p>
                </div>
              </section>
            )}

            {dest.packageCount > 0 && (
              <section className="pk-summary" aria-labelledby="pkgs-title">
                <h2 id="pkgs-title">Packages</h2>
                <p className="pk-check-note">
                  {dest.packageCount} {dest.packageCount === 1 ? "package goes" : "packages go"} here.{" "}
                  <Link className="pk-link" href={`/admin/packages?destination=${dest.slug}`}>
                    See them
                  </Link>
                </p>
              </section>
            )}
          </aside>
        </div>
      </div>
    </ProtectedPage>
  );
}

export default function DestinationEditPage() {
  // useSearchParams needs a Suspense boundary so the page can still be prepared ahead of time.
  return (
    <Suspense fallback={null}>
      <DestinationEditor />
    </Suspense>
  );
}
