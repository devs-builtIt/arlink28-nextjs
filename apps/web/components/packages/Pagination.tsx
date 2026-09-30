import Link from "next/link";

/** 1 2 [3] 4 ... 12: always the ends, and the current page with its neighbours. */
function pageWindow(page: number, pages: number): (number | "gap")[] {
  const keep = new Set([1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages));
  const sorted = [...keep].sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push("gap");
    out.push(n);
  });
  return out;
}

/** Numbered pages as ordinary links, so they work without scripts and can be shared. */
export default function Pagination({
  page,
  pageSize,
  total,
  hrefFor,
}: {
  page: number;
  pageSize: number;
  total: number;
  /** The address of a page, keeping the current filters. */
  hrefFor: (page: number) => string;
}) {
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <nav className="pkgs-pager" aria-label="Pages">
      <p>
        Showing {from} to {to} of {total} packages
      </p>
      <ul>
        <li>
          {page > 1 ? (
            <Link href={hrefFor(page - 1)} rel="prev">
              Previous
            </Link>
          ) : (
            <span aria-disabled="true">Previous</span>
          )}
        </li>
        {pageWindow(page, pages).map((n, i) =>
          n === "gap" ? (
            <li key={`gap-${i}`} className="pkgs-page-gap" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={n}>
              <Link href={hrefFor(n)} aria-label={`Page ${n}`} aria-current={n === page ? "page" : undefined}>
                {n}
              </Link>
            </li>
          ),
        )}
        <li>
          {page < pages ? (
            <Link href={hrefFor(page + 1)} rel="next">
              Next
            </Link>
          ) : (
            <span aria-disabled="true">Next</span>
          )}
        </li>
      </ul>
    </nav>
  );
}
