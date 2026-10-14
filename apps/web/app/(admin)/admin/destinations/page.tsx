"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { AdminDestinationList } from "@arlink28/api-client";
import ProtectedPage from "@/components/ProtectedPage";
import Notice from "@/components/admin/Notice";
import { Pagination, Skeleton, StatusBadge } from "@/components/admin/ui";
import { fullDate, timeAgo } from "@/components/admin/format";
import { adminDestinationsApi } from "@/utils/api/destinations";
import { africanCountries } from "@/utils/countries";
import { countryName } from "@/utils/destinations";

const SIZES = [10, 25, 50, 100];
const TABS: [string, string][] = [
  ["", "All"],
  ["Published", "Published"],
  ["Draft", "Draft"],
];
const KINDS: [string, string][] = [
  ["", "Countries and places"],
  ["Country", "Countries"],
  ["Place", "Places"],
];

function tabCount(counts: AdminDestinationList["counts"] | undefined, status: string): number | undefined {
  if (!counts) return undefined;
  return { "": counts.all, Published: counts.published, Draft: counts.draft }[status];
}

function SkeletonRows({ rows = 10 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, i) => (
        <tr key={i} aria-hidden="true">
          <td>
            <div className="pkg">
              <Skeleton w={52} h={39} />
              <div className="pk-stack">
                <Skeleton w={`${150 + ((i * 37) % 80)}px`} h={13} />
                <Skeleton w={90} h={11} />
              </div>
            </div>
          </td>
          <td>
            <Skeleton w={70} h={22} r={6} />
          </td>
          <td>
            <Skeleton w={140} />
          </td>
          <td>
            <Skeleton w={90} />
          </td>
          <td>
            <Skeleton w={70} />
          </td>
        </tr>
      ))}
    </>
  );
}

function DestinationsList() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // The address holds the state, so a refresh or the back button lands where you were.
  const status = params.get("status") ?? "";
  const q = params.get("q") ?? "";
  const country = params.get("country") ?? "";
  const kind = params.get("kind") ?? "";
  const page = Math.max(1, Number.parseInt(params.get("page") ?? "1", 10) || 1);
  const requestedSize = Number.parseInt(params.get("size") ?? "25", 10);
  const size = SIZES.includes(requestedSize) ? requestedSize : 25;

  const [data, setData] = useState<AdminDestinationList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [search, setSearch] = useState(q);
  // The search text we last put in the address, so the address never overwrites newer typing.
  const pushedSearch = useRef(q);
  const countries = africanCountries();

  function update(patch: Record<string, string | undefined>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    // A new filter or search starts again at the first page.
    if (!("page" in patch)) next.delete("page");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  // Typing searches after a short pause, on the server, so the totals and pages stay right.
  useEffect(() => {
    if (search.trim() === pushedSearch.current) return;
    const timer = setTimeout(() => {
      pushedSearch.current = search.trim();
      update({ q: search.trim() || undefined });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);
  // Back, forward and links change the address without typing: follow them.
  useEffect(() => {
    if (q !== pushedSearch.current) {
      pushedSearch.current = q;
      setSearch(q);
    }
  }, [q]);

  function clearFilters() {
    pushedSearch.current = "";
    setSearch("");
    update({ q: undefined, country: undefined, kind: undefined });
  }

  useEffect(() => {
    let stale = false;
    setLoading(true);
    setError("");
    adminDestinationsApi
      .list({
        status: status || undefined,
        search: q || undefined,
        country: country || undefined,
        kind: kind || undefined,
        page,
        pageSize: size,
      })
      .then((result) => !stale && setData(result))
      .catch((err) => !stale && setError(err instanceof Error ? err.message : "Destinations couldn't be loaded."))
      .finally(() => !stale && setLoading(false));
    return () => {
      stale = true;
    };
  }, [status, q, country, kind, page, size, retry]);

  // A page past the end (a shorter list, or an old link) goes to the last one.
  const lastPage = data ? Math.max(1, Math.ceil(data.total / size)) : 1;
  const pastEnd = !loading && data !== null && page > lastPage;
  useEffect(() => {
    if (pastEnd) update({ page: lastPage > 1 ? String(lastPage) : undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pastEnd, lastPage]);

  const filtered = !!(q || country || kind);
  const firstLoad = data === null;
  const items = data?.items ?? [];

  function goToPage(next: number) {
    update({ page: next > 1 ? String(next) : undefined });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <ProtectedPage wide>
      <div className="pk">
        <div className="pk-header">
          <div>
            <h1 className="pk-title">Destinations</h1>
            <p className="pk-meta">
              <span>The countries and places the site writes about. Each stays a draft until you publish it.</span>
            </p>
          </div>
          <div className="pk-header-actions">
            <Link className="btn btn-primary" href="/admin/destinations/new">
              <i className="fa-solid fa-plus" aria-hidden="true"></i>
              New destination
            </Link>
          </div>
        </div>

        <div className="pk-tabs" role="tablist" aria-label="Status">
          {TABS.map(([value, label]) => {
            const count = tabCount(data?.counts, value);
            return (
              <button
                key={label}
                type="button"
                role="tab"
                className="pk-tab"
                aria-selected={status === value}
                onClick={() => update({ status: value || undefined })}
              >
                {label}
                {count === undefined ? (
                  <Skeleton w={22} h={20} r={999} />
                ) : (
                  <span className="pk-tab-count">{count}</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="pk-filters" role="search">
          <label className="pk-search">
            <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
            <span className="sr-only">Search destinations</span>
            <input
              className="input"
              type="search"
              placeholder="Search by name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <select
            className="input"
            aria-label="Country"
            value={country}
            onChange={(e) => update({ country: e.target.value || undefined })}
          >
            <option value="">All countries</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            className="input"
            aria-label="Kind"
            value={kind}
            onChange={(e) => update({ kind: e.target.value || undefined })}
          >
            {KINDS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {filtered && (
            <button type="button" className="btn btn-quiet" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>

        {error && (
          <Notice tone="error">
            {error}{" "}
            <button type="button" className="pk-link" onClick={() => setRetry((n) => n + 1)}>
              Try again
            </button>
          </Notice>
        )}

        <div className="pk-table-panel" aria-busy={loading && !firstLoad}>
          {loading && !firstLoad && (
            <span className="pk-progress" role="progressbar" aria-label="Loading destinations"></span>
          )}
          <div className="pk-table-scroll">
            <table className="pk-table packages">
              <thead>
                <tr>
                  <th scope="col">Destination</th>
                  <th scope="col">Status</th>
                  <th scope="col">Where</th>
                  <th scope="col">Content</th>
                  <th scope="col">Updated</th>
                </tr>
              </thead>
              <tbody>
                {firstLoad && !error && <SkeletonRows rows={Math.min(size, 10)} />}
                {items.map((d) => (
                  <tr key={d.id} className="row-link" onClick={() => router.push(`/admin/destinations/${d.id}`)}>
                    <td>
                      <div className="pkg">
                        {d.heroPath ? (
                          <img className="pkg-thumb" src={d.heroPath} alt="" />
                        ) : (
                          <span className="pkg-thumb pkg-thumb-empty" aria-hidden="true">
                            <i className="fa-solid fa-image"></i>
                          </span>
                        )}
                        <span>
                          <Link
                            className="pkg-title"
                            href={`/admin/destinations/${d.id}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {d.name}
                          </Link>
                          <span className="pkg-sub">
                            <span>/{d.slug}</span>
                          </span>
                        </span>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={d.status} />
                    </td>
                    <td>
                      {d.kind === "Country" ? (
                        "Country"
                      ) : (
                        <span>
                          {d.parentName ?? countryName(d.country)}
                          <span className="pkg-sub">
                            <span>Place</span>
                          </span>
                        </span>
                      )}
                    </td>
                    <td className="muted">
                      {d.kind === "Country"
                        ? `${d.placeCount} ${d.placeCount === 1 ? "place" : "places"}`
                        : `${d.attractionCount} ${d.attractionCount === 1 ? "attraction" : "attractions"}`}
                    </td>
                    <td className="muted">
                      <time dateTime={d.updatedAt} title={fullDate(d.updatedAt)}>
                        {timeAgo(d.updatedAt)}
                      </time>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!firstLoad && items.length === 0 && !loading && !pastEnd && (
            <div className="pk-empty">
              {filtered ? (
                <>
                  <h2>No destinations found</h2>
                  <p>No destinations match these filters.</p>
                  <button type="button" className="btn btn-quiet" onClick={clearFilters}>
                    Clear filters
                  </button>
                </>
              ) : status ? (
                <>
                  <h2>Nothing here</h2>
                  <p>There are no {status.toLowerCase()} destinations.</p>
                </>
              ) : (
                <>
                  <h2>No destinations yet</h2>
                  <p>Add a country first, then the places inside it. Nothing shows on the site until you publish it.</p>
                  <Link className="btn btn-primary" href="/admin/destinations/new">
                    New destination
                  </Link>
                </>
              )}
            </div>
          )}

          {data && data.total > 0 && (
            <Pagination
              page={Math.min(page, lastPage)}
              pageSize={size}
              total={data.total}
              busy={loading}
              noun={data.total === 1 ? "destination" : "destinations"}
              onPage={goToPage}
              onPageSize={(n) => update({ size: n === 25 ? undefined : String(n) })}
              sizes={SIZES}
            />
          )}
        </div>
      </div>
    </ProtectedPage>
  );
}

export default function DestinationsAdminPage() {
  // useSearchParams needs a Suspense boundary so the page can still be prepared ahead of time.
  return (
    <Suspense fallback={null}>
      <DestinationsList />
    </Suspense>
  );
}
