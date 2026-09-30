"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { AdminPackageList, DestinationResponse } from "@arlink28/api-client";
import ProtectedPage from "@/components/ProtectedPage";
import Notice from "@/components/admin/Notice";
import { Pagination, Skeleton, StatusBadge } from "@/components/admin/ui";
import { adminPackagesApi, packagesApi } from "@/utils/api/packages";
import { fullDate, money, party, timeAgo, titleCase } from "@/components/admin/format";

const CATEGORIES = ["SAFARI", "LODGE"];
const SIZES = [10, 25, 50, 100];
const TABS: [string, string][] = [
  ["", "All"],
  ["Published", "Published"],
  ["Draft", "Draft"],
  ["Archived", "Archived"],
];

function tabCount(counts: AdminPackageList["counts"] | undefined, status: string): number | undefined {
  if (!counts) return undefined;
  return { "": counts.all, Published: counts.published, Draft: counts.draft, Archived: counts.archived }[status];
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
                <Skeleton w={`${180 + ((i * 37) % 80)}px`} h={13} />
                <Skeleton w={90} h={11} />
              </div>
            </div>
          </td>
          <td>
            <Skeleton w={70} h={22} r={6} />
          </td>
          <td>
            <Skeleton w={90} />
          </td>
          <td>
            <Skeleton w={60} />
          </td>
          <td>
            <Skeleton w={110} />
          </td>
          <td className="num">
            <Skeleton w={64} />
          </td>
          <td>
            <Skeleton w={70} />
          </td>
        </tr>
      ))}
    </>
  );
}

function PackagesList() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // The address holds the state, so a refresh or the back button lands where you were.
  const status = params.get("status") ?? "";
  const q = params.get("q") ?? "";
  const destination = params.get("destination") ?? "";
  const category = params.get("category") ?? "";
  const page = Math.max(1, Number.parseInt(params.get("page") ?? "1", 10) || 1);
  const requestedSize = Number.parseInt(params.get("size") ?? "25", 10);
  const size = SIZES.includes(requestedSize) ? requestedSize : 25;

  const [destinations, setDestinations] = useState<DestinationResponse[]>([]);
  const [data, setData] = useState<AdminPackageList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [search, setSearch] = useState(q);
  // The search text we last put in the address, so the address never overwrites newer typing.
  const pushedSearch = useRef(q);

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

  useEffect(() => {
    packagesApi
      .destinations()
      .then(setDestinations)
      .catch(() => undefined); // the filter just stays empty
  }, []);

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
    update({ q: undefined, destination: undefined, category: undefined });
  }

  useEffect(() => {
    let stale = false;
    setLoading(true);
    setError("");
    adminPackagesApi
      .list({
        status: status || undefined,
        search: q || undefined,
        destination: destination || undefined,
        category: category || undefined,
        page,
        pageSize: size,
      })
      .then((result) => !stale && setData(result))
      .catch((err) => !stale && setError(err instanceof Error ? err.message : "Packages couldn't be loaded."))
      .finally(() => !stale && setLoading(false));
    return () => {
      stale = true;
    };
  }, [status, q, destination, category, page, size, retry]);

  // A page past the end (a shorter list, or an old link) goes to the last one.
  const lastPage = data ? Math.max(1, Math.ceil(data.total / size)) : 1;
  const pastEnd = !loading && data !== null && page > lastPage;
  useEffect(() => {
    if (pastEnd) update({ page: lastPage > 1 ? String(lastPage) : undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pastEnd, lastPage]);

  const filtered = !!(q || destination || category);
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
            <h1 className="pk-title">Packages</h1>
            <p className="pk-meta">
              <span>Everything on the site, and every draft that isn&apos;t yet.</span>
            </p>
          </div>
          <div className="pk-header-actions">
            <Link className="btn btn-primary" href="/admin/packages/new">
              <i className="fa-solid fa-plus" aria-hidden="true"></i>
              New package
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
            <span className="sr-only">Search packages</span>
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
            aria-label="Destination"
            value={destination}
            onChange={(e) => update({ destination: e.target.value || undefined })}
          >
            <option value="">All destinations</option>
            {destinations.map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.name}
              </option>
            ))}
          </select>
          <select
            className="input"
            aria-label="Category"
            value={category}
            onChange={(e) => update({ category: e.target.value || undefined })}
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {titleCase(c)}
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
            <span className="pk-progress" role="progressbar" aria-label="Loading packages"></span>
          )}
          <div className="pk-table-scroll">
            <table className="pk-table packages">
              <thead>
                <tr>
                  <th scope="col">Package</th>
                  <th scope="col">Status</th>
                  <th scope="col">Destination</th>
                  <th scope="col">Stay</th>
                  <th scope="col">Party</th>
                  <th scope="col" className="num">
                    From
                  </th>
                  <th scope="col">Updated</th>
                </tr>
              </thead>
              <tbody>
                {firstLoad && !error && <SkeletonRows rows={Math.min(size, 10)} />}
                {items.map((p) => (
                  <tr key={p.id} className="row-link" onClick={() => router.push(`/admin/packages/${p.id}`)}>
                    <td>
                      <div className="pkg">
                        {p.heroImagePath ? (
                          <img className="pkg-thumb" src={p.heroImagePath} alt="" />
                        ) : (
                          <span className="pkg-thumb pkg-thumb-empty" aria-hidden="true">
                            <i className="fa-solid fa-image"></i>
                          </span>
                        )}
                        <span>
                          <Link
                            className="pkg-title"
                            href={`/admin/packages/${p.id}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {p.title}
                          </Link>
                          <span className="pkg-sub">
                            <span>{titleCase(p.category)}</span>
                            {p.mediaCount > 0 && (
                              <span>
                                {p.mediaCount} {p.mediaCount === 1 ? "photo" : "photos"}
                              </span>
                            )}
                          </span>
                        </span>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                    <td>{p.destination.name}</td>
                    <td className="muted">
                      {p.nights} {p.nights === 1 ? "night" : "nights"}
                    </td>
                    <td className="muted">{party(p.adults, p.children)}</td>
                    <td className="num">
                      {p.fromPriceMinor != null ? (
                        money(p.fromPriceMinor, p.baseCurrency)
                      ) : (
                        <span className="muted">No price</span>
                      )}
                    </td>
                    <td className="muted">
                      <time dateTime={p.updatedAt} title={fullDate(p.updatedAt)}>
                        {timeAgo(p.updatedAt)}
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
                  <h2>No packages found</h2>
                  <p>No packages match these filters.</p>
                  <button type="button" className="btn btn-quiet" onClick={clearFilters}>
                    Clear filters
                  </button>
                </>
              ) : status ? (
                <>
                  <h2>Nothing here</h2>
                  <p>There are no {status.toLowerCase()} packages.</p>
                </>
              ) : (
                <>
                  <h2>No packages yet</h2>
                  <p>Create a package to start building the catalogue. It stays a draft until you publish it.</p>
                  <Link className="btn btn-primary" href="/admin/packages/new">
                    New package
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
              noun={data.total === 1 ? "package" : "packages"}
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

export default function PackagesPage() {
  // useSearchParams needs a Suspense boundary so the page can still be prepared ahead of time.
  return (
    <Suspense fallback={null}>
      <PackagesList />
    </Suspense>
  );
}
