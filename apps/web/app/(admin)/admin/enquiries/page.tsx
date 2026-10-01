"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { EnquiryList, EnquiryStatus } from "@arlink28/api-client";
import ProtectedPage from "@/components/ProtectedPage";
import Notice from "@/components/admin/Notice";
import { Pagination, Skeleton } from "@/components/admin/ui";
import { EnquiryStatusBadge, STATUSES, tripLine, typeLabel } from "@/components/admin/EnquiryParts";
import { fullDate, timeAgo } from "@/components/admin/format";
import { adminEnquiriesApi } from "@/utils/api/enquiries";
import { PRODUCT_TYPES, isHoliday, isProductType, typeLabel as kindLabel } from "@/utils/productTypes";

const SIZES = [10, 25, 50, 100];
const TABS: [EnquiryStatus | "", string][] = [
  ["", "All"],
  ["New", "New"],
  ["Contacted", "Contacted"],
  ["Closed", "Closed"],
];

function tabCount(counts: EnquiryList["counts"] | undefined, status: EnquiryStatus | ""): number | undefined {
  if (!counts) return undefined;
  return { "": counts.all, New: counts.new, Contacted: counts.contacted, Closed: counts.closed }[status];
}

function SkeletonRows({ rows }: { rows: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, i) => (
        <tr key={i} aria-hidden="true">
          <td>
            <Skeleton w={96} />
          </td>
          <td>
            <div className="pk-stack">
              <Skeleton w={`${100 + ((i * 29) % 60)}px`} h={13} />
              <Skeleton w={150} h={11} />
            </div>
          </td>
          <td>
            <div className="pk-stack">
              <Skeleton w={`${150 + ((i * 41) % 90)}px`} h={13} />
              <Skeleton w={120} h={11} />
            </div>
          </td>
          <td>
            <Skeleton w={76} h={22} r={6} />
          </td>
          <td>
            <Skeleton w={70} />
          </td>
        </tr>
      ))}
    </>
  );
}

function EnquiriesList() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // The address holds the state, so a refresh or the back button lands where you were.
  const asked = params.get("status") ?? "";
  const status = (STATUSES as string[]).includes(asked) ? (asked as EnquiryStatus) : "";
  const rawKind = params.get("type");
  const kind = isProductType(rawKind) ? rawKind : "";
  const page = Math.max(1, Number.parseInt(params.get("page") ?? "1", 10) || 1);
  const requestedSize = Number.parseInt(params.get("size") ?? "25", 10);
  const size = SIZES.includes(requestedSize) ? requestedSize : 25;

  const [data, setData] = useState<EnquiryList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  function update(patch: Record<string, string | undefined>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    if (!("page" in patch)) next.delete("page");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  useEffect(() => {
    let stale = false;
    setLoading(true);
    setError("");
    adminEnquiriesApi
      .list({ status: status || undefined, type: kind || undefined, page, pageSize: size })
      .then((result) => !stale && setData(result))
      .catch((err) => !stale && setError(err instanceof Error ? err.message : "Enquiries couldn't be loaded."))
      .finally(() => !stale && setLoading(false));
    return () => {
      stale = true;
    };
  }, [status, kind, page, size, retry]);

  // A page past the end (a shorter list, or an old link) goes to the last one.
  const lastPage = data ? Math.max(1, Math.ceil(data.total / size)) : 1;
  const pastEnd = !loading && data !== null && page > lastPage;
  useEffect(() => {
    if (pastEnd) update({ page: lastPage > 1 ? String(lastPage) : undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pastEnd, lastPage]);

  const firstLoad = data === null;
  const items = data?.items ?? [];
  const waiting = data?.counts.new;

  function goToPage(next: number) {
    update({ page: next > 1 ? String(next) : undefined });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <ProtectedPage wide>
      <div className="pk enq">
        <div className="pk-header">
          <div>
            <h1 className="pk-title">Enquiries</h1>
            <p className="pk-meta">
              <span>
                {waiting === undefined
                  ? "What guests send from the contact page."
                  : waiting === 0
                    ? "Nothing is waiting for a reply."
                    : `${waiting} ${waiting === 1 ? "enquiry is" : "enquiries are"} waiting for a reply.`}
              </span>
            </p>
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

        <div className="pk-filters">
          <select
            className="input"
            aria-label="Kind"
            value={kind}
            onChange={(e) => update({ type: e.target.value || undefined })}
          >
            <option value="">All kinds</option>
            {PRODUCT_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.plural}
              </option>
            ))}
          </select>
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
            <span className="pk-progress" role="progressbar" aria-label="Loading enquiries"></span>
          )}
          <div className="pk-table-scroll">
            <table className="pk-table enq-table">
              <thead>
                <tr>
                  <th scope="col">Reference</th>
                  <th scope="col">Guest</th>
                  <th scope="col">Enquiry</th>
                  <th scope="col">Status</th>
                  <th scope="col">Received</th>
                </tr>
              </thead>
              <tbody>
                {firstLoad && !error && <SkeletonRows rows={Math.min(size, 8)} />}
                {items.map((e) => {
                  const trip = tripLine(e);
                  return (
                    <tr
                      key={e.id}
                      className="row-link"
                      data-unread={e.status === "New" || undefined}
                      onClick={() => router.push(`/admin/enquiries/${e.id}`)}
                    >
                      <td className="enq-ref">{e.reference}</td>
                      <td>
                        <span className="enq-guest">{e.name}</span>
                        <span className="enq-sub">{e.email}</span>
                      </td>
                      <td>
                        <Link
                          className="enq-subject"
                          href={`/admin/enquiries/${e.id}`}
                          onClick={(ev) => ev.stopPropagation()}
                        >
                          {e.packageTitle ?? e.subject ?? typeLabel(e.type)}
                        </Link>
                        <span className="enq-sub">
                          {e.packageTitle
                            ? [
                                e.productType && !isHoliday(e.productType) ? kindLabel(e.productType) : null,
                                trip ?? "No dates given",
                              ]
                                .filter(Boolean)
                                .join(", ")
                            : typeLabel(e.type)}
                        </span>
                      </td>
                      <td>
                        <EnquiryStatusBadge status={e.status} />
                      </td>
                      <td className="muted">
                        <time dateTime={e.createdAt} title={fullDate(e.createdAt)}>
                          {timeAgo(e.createdAt)}
                        </time>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!firstLoad && items.length === 0 && !loading && !pastEnd && (
            <div className="pk-empty">
              {status || kind ? (
                <>
                  <h2>Nothing here</h2>
                  <p>
                    There are no {status.toLowerCase()} enquiries{kind ? ` about ${kindLabel(kind).toLowerCase()}` : ""}
                    .
                  </p>
                  <button
                    type="button"
                    className="btn btn-quiet"
                    onClick={() => update({ status: undefined, type: undefined })}
                  >
                    Show all enquiries
                  </button>
                </>
              ) : (
                <>
                  <h2>No enquiries yet</h2>
                  <p>Enquiries from the contact page and from each package&apos;s Enquire button appear here.</p>
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
              noun={data.total === 1 ? "enquiry" : "enquiries"}
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

export default function EnquiriesPage() {
  // useSearchParams needs a Suspense boundary so the page can still be prepared ahead of time.
  return (
    <Suspense fallback={null}>
      <EnquiriesList />
    </Suspense>
  );
}
