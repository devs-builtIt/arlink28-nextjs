"use client";

import Link from "next/link";
import type { AdminPackageDetail, AdminPackageList } from "@arlink28/api-client";
import { usePackageMoves, type PackageMove } from "@/components/admin/usePackageMoves";
import { StatusBadge } from "@/components/admin/ui";
import { fullDate, money, party, timeAgo, titleCase } from "@/components/admin/format";
import { adminPackagesApi } from "@/utils/api/packages";
import { detailsSummary, isHoliday, typeLabel } from "@/utils/productTypes";

type Item = AdminPackageList["items"][number];

/**
 * One listing as a card: its photo, what it is and where, what is missing, and the moves staff make most
 * (edit, publish, take down, archive). Publishing lists what the listing still needs. Taking it off the
 * site and archiving ask twice, in place, so a stray click does nothing.
 */
export default function PackageCard({ item: p, onChanged }: { item: Item; onChanged: () => void }) {
  const { busy, confirming, setConfirming, missing, error, move } = usePackageMoves(onChanged);

  const published = p.status === "Published";
  const archived = p.status === "Archived";
  const gaps = archived
    ? []
    : [p.mediaCount === 0 && "No photo", p.fromPriceMinor == null && "No price"].filter(Boolean);

  /** The first click asks, the second does it. */
  const twice = (kind: PackageMove, label: string, run: () => Promise<AdminPackageDetail>, tone = "") =>
    confirming === kind ? (
      <button
        type="button"
        className="pk-act is-danger"
        disabled={busy}
        onClick={() => move(run)}
        onBlur={() => setConfirming(null)}
        autoFocus
      >
        Sure?
      </button>
    ) : (
      <button type="button" className={`pk-act ${tone}`} disabled={busy} onClick={() => setConfirming(kind)}>
        {label}
      </button>
    );

  return (
    <article className="pk-card" data-status={p.status.toLowerCase()}>
      <Link className="pk-card-media" href={`/admin/packages/${p.id}`} tabIndex={-1} aria-hidden="true">
        {p.heroImagePath ? (
          <img src={p.heroImagePath} alt="" />
        ) : (
          <span className="pk-card-empty">
            <i className="fa-solid fa-image"></i>
          </span>
        )}
      </Link>
      <div className="pk-card-flags">
        <StatusBadge status={p.status} />
        <span className="pk-card-kind">
          {isHoliday(p.productType) ? titleCase(p.category) : typeLabel(p.productType)}
        </span>
      </div>

      <div className="pk-card-body">
        <Link className="pk-card-title" href={`/admin/packages/${p.id}`}>
          {p.title}
        </Link>
        <p className="pk-card-sub">
          {p.destination.name}
          {" · "}
          {isHoliday(p.productType)
            ? `${p.nights} ${p.nights === 1 ? "night" : "nights"}, ${party(p.adults, p.children)}`
            : detailsSummary(p.productType, p.details) || "No details yet"}
        </p>
        {gaps.length > 0 && (
          <ul className="pk-card-gaps" aria-label="Missing">
            {gaps.map((g) => (
              <li key={String(g)}>{g}</li>
            ))}
          </ul>
        )}
        <p className="pk-card-price">
          <span>
            {p.fromPriceMinor != null ? (
              <>
                <small>From</small> {money(p.fromPriceMinor, p.baseCurrency)}
              </>
            ) : (
              <small>No price</small>
            )}
          </span>
          <small>
            <time dateTime={p.updatedAt} title={fullDate(p.updatedAt)}>
              {timeAgo(p.updatedAt)}
            </time>
          </small>
        </p>
      </div>

      {(error || missing.length > 0) && (
        <div className="pk-card-note" role="alert">
          {error || (
            <>
              Not ready to publish. Still needed:
              <ul>
                {missing.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      <div className="pk-card-actions">
        <Link className="pk-act is-edit" href={`/admin/packages/${p.id}`} aria-label={`Edit ${p.title}`}>
          <i className="fa-solid fa-pen" aria-hidden="true"></i>
          Edit
        </Link>
        {p.status === "Draft" && (
          <button
            type="button"
            className="pk-act is-go"
            disabled={busy}
            onClick={() => move(() => adminPackagesApi.publish(p.id))}
          >
            {busy ? "Publishing" : "Publish"}
          </button>
        )}
        {archived && (
          <button
            type="button"
            className="pk-act is-go"
            disabled={busy}
            onClick={() => move(() => adminPackagesApi.unpublish(p.id))}
          >
            Move to drafts
          </button>
        )}
        {published && twice("unpublish", "Take off", () => adminPackagesApi.unpublish(p.id))}
        {!archived && twice("archive", "Archive", () => adminPackagesApi.archive(p.id), "is-quiet")}
      </div>
    </article>
  );
}
