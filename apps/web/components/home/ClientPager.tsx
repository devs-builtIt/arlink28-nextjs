"use client";

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

/**
 * Numbered pages for a list that is already on the page, so changing page does not reload it. The same look as the
 * pager under the listings (flights, hotels, visas, packages). It draws nothing when everything fits on one page.
 */
export default function ClientPager({
  page,
  pageSize,
  total,
  noun,
  onPage,
}: {
  page: number;
  pageSize: number;
  total: number;
  /** What is being counted, plural: "services". */
  noun: string;
  onPage: (page: number) => void;
}) {
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <nav className="hm-pager" aria-label="Pages">
      <p>
        Showing {from} to {to} of {total} {noun}
      </p>
      <ul>
        <li>
          <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)}>
            Previous
          </button>
        </li>
        {pageWindow(page, pages).map((n, i) =>
          n === "gap" ? (
            <li key={`gap-${i}`} className="hm-pager-gap" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={n}>
              <button
                type="button"
                aria-label={`Page ${n}`}
                aria-current={n === page ? "page" : undefined}
                onClick={() => onPage(n)}
              >
                {n}
              </button>
            </li>
          ),
        )}
        <li>
          <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)}>
            Next
          </button>
        </li>
      </ul>
    </nav>
  );
}
