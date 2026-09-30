import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

/** A status with a colour that means something, and a dot so it never relies on colour alone. */
export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "success" | "neutral" | "warning";
  children: ReactNode;
}) {
  return (
    <span className="pk-badge" data-tone={tone}>
      {children}
    </span>
  );
}

const STATUS_TONE = { Published: "success", Draft: "neutral", Archived: "warning" } as const;

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONE[status as keyof typeof STATUS_TONE] ?? "neutral"}>{status}</Badge>;
}

/** A placeholder shaped like the thing that is loading. Pulses; never shimmers. */
export function Skeleton({
  w,
  h = 12,
  r,
  style,
}: {
  w?: number | string;
  h?: number | string;
  r?: number;
  style?: CSSProperties;
}) {
  return <span className="sk" aria-hidden="true" style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

/** For a button that is working. The label stays, so the button doesn't change width. */
export function Spinner() {
  return <span className="spinner" aria-hidden="true" />;
}

export function Crumbs({ trail }: { trail: { label: string; href?: string }[] }) {
  return (
    <nav className="pk-crumbs" aria-label="Breadcrumb">
      <ol>
        {trail.map((c, i) => (
          <li key={c.label}>
            {c.href ? <Link href={c.href}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}
            {i < trail.length - 1 && <span className="pk-crumb-sep" aria-hidden="true"></span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** 1 2 [3] 4 ... 12: always the ends, and the current page with its neighbours. */
export function pageWindow(page: number, pages: number): (number | "gap")[] {
  const keep = new Set([1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages));
  const sorted = [...keep].sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push("gap");
    out.push(n);
  });
  return out;
}

type PagerProps = {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
  sizes?: number[];
  busy?: boolean;
  noun?: string;
};

export function Pagination({
  page,
  pageSize,
  total,
  onPage,
  onPageSize,
  sizes = [10, 25, 50, 100],
  busy,
  noun = "results",
}: PagerProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <nav className="pk-pager" aria-label="Pagination">
      <p className="pk-pager-info" role="status">
        {total === 0 ? `No ${noun}` : `Showing ${from} to ${to} of ${total} ${noun}`}
      </p>
      <div className="pk-pager-controls">
        <label className="pk-pager-size">
          <span>Rows per page</span>
          <select className="input" value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))}>
            {sizes.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <div className="pk-pages">
          <button
            type="button"
            className="btn btn-quiet btn-s"
            onClick={() => onPage(page - 1)}
            disabled={page <= 1 || busy}
          >
            Previous
          </button>
          <ol>
            {pageWindow(page, pages).map((n, i) =>
              n === "gap" ? (
                <li key={`gap-${i}`} className="pk-page-gap" aria-hidden="true">
                  …
                </li>
              ) : (
                <li key={n}>
                  <button
                    type="button"
                    className="pk-page"
                    aria-label={`Page ${n}`}
                    aria-current={n === page ? "page" : undefined}
                    onClick={() => onPage(n)}
                    disabled={busy}
                  >
                    {n}
                  </button>
                </li>
              ),
            )}
          </ol>
          <button
            type="button"
            className="btn btn-quiet btn-s"
            onClick={() => onPage(page + 1)}
            disabled={page >= pages || busy}
          >
            Next
          </button>
        </div>
      </div>
    </nav>
  );
}

/**
 * One section of a form. On a wide screen the description sits beside the fields;
 * on a narrow one it sits above them.
 */
export function Panel({
  id,
  title,
  description,
  split = true,
  children,
}: {
  id: string;
  title: string;
  description?: ReactNode;
  split?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="pk-panel-outer" id={id}>
      <section className="pk-panel" data-split={split || undefined} aria-labelledby={`${id}-title`}>
        <div className="pk-panel-head">
          <h2 id={`${id}-title`}>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        <div className="pk-panel-body">{children}</div>
      </section>
    </div>
  );
}
